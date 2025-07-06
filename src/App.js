import React, { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/core";
import { Button } from "./components/ui/button";

const FIELD_TYPES = ["label", "text", "number", "boolean", "enum"];

function FieldEditor({ field, onChange, onDelete }) {
  return (
    <div className="border p-2 my-2 rounded bg-white">
      <select
        value={field.type}
        onChange={(e) => onChange({ ...field, type: e.target.value })}
        className="border p-1 rounded mr-2"
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        placeholder="Field Label"
        className="border p-1 rounded"
        value={field.label || ""}
        onChange={(e) => onChange({ ...field, label: e.target.value })}
      />
      {field.type === "enum" && (
        <input
          className="border p-1 rounded mt-1 block"
          placeholder="Option1,Option2"
          value={field.options?.join(",") || ""}
          onChange={(e) =>
            onChange({ ...field, options: e.target.value.split(",") })
          }
        />
      )}
      <Button variant="destructive" className="ml-4" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}

function Section({ section, onChange }) {
  function updateField(index, updated) {
    const updatedFields = [...section.fields];
    updatedFields[index] = updated;
    onChange({ ...section, fields: updatedFields });
  }
  function deleteField(index) {
    const updatedFields = [...section.fields];
    updatedFields.splice(index, 1);
    onChange({ ...section, fields: updatedFields });
  }
  return (
    <div className="p-4 border rounded mt-4 bg-gray-100">
      <input
        className="text-lg font-bold border-b mb-2 w-full"
        placeholder="Section Title"
        value={section.title}
        onChange={(e) => onChange({ ...section, title: e.target.value })}
      />
      {section.fields.map((field, i) => (
        <FieldEditor
          key={field.id}
          field={field}
          onChange={(f) => updateField(i, f)}
          onDelete={() => deleteField(i)}
        />
      ))}
      <Button
        className="mt-2"
        onClick={() =>
          onChange({
            ...section,
            fields: [
              ...section.fields,
              { id: uuid(), type: "text", label: "" },
            ],
          })
        }
      >
        Add Field
      </Button>
    </div>
  );
}

function TemplateBuilder() {
  const [templates, setTemplates] = useState(() => {
    const stored = localStorage.getItem("templates");
    return stored ? JSON.parse(stored) : [];
  });
  const [currentTemplate, setCurrentTemplate] = useState(null);

  useEffect(() => {
    localStorage.setItem("templates", JSON.stringify(templates));
  }, [templates]);

  const createTemplate = () => {
    if (templates.length >= 5) return;
    const newTemplate = {
      id: uuid(),
      name: `Template ${templates.length + 1}`,
      sections: [{ id: uuid(), title: "Section 1", fields: [] }],
    };
    setTemplates([...templates, newTemplate]);
    setCurrentTemplate(newTemplate);
  };

  const updateSection = (index, updated) => {
    const updatedSections = [...currentTemplate.sections];
    updatedSections[index] = updated;
    setCurrentTemplate({ ...currentTemplate, sections: updatedSections });
    setTemplates(
      templates.map((t) =>
        t.id === currentTemplate.id ? { ...t, sections: updatedSections } : t
      )
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Form Template Builder</h1>
      <Button onClick={createTemplate} disabled={templates.length >= 5}>
        Create New Template
      </Button>
      <div className="flex mt-4 space-x-2">
        {templates.map((t) => (
          <Button
            key={t.id}
            variant={t.id === currentTemplate?.id ? "default" : "outline"}
            onClick={() => setCurrentTemplate(t)}
          >
            {t.name}
          </Button>
        ))}
      </div>

      {currentTemplate && (
        <div className="mt-6">
          {currentTemplate.sections.map((section, i) => (
            <Section
              key={section.id}
              section={section}
              onChange={(s) => updateSection(i, s)}
            />
          ))}
          <Button
            className="mt-4"
            onClick={() => {
              const newSection = { id: uuid(), title: "", fields: [] };
              const updatedSections = [...currentTemplate.sections, newSection];
              setCurrentTemplate({
                ...currentTemplate,
                sections: updatedSections,
              });
              setTemplates(
                templates.map((t) =>
                  t.id === currentTemplate.id
                    ? { ...t, sections: updatedSections }
                    : t
                )
              );
            }}
          >
            Add Section
          </Button>
        </div>
      )}
    </div>
  );
}

function DynamicForm({ template }) {
  const [formData, setFormData] = useState({});

  const handleChange = (fieldId, value) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = () => {
    const key = `form_data_${template.id}`;
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...prev, formData]));
    alert("Form submitted!");
    setFormData({});
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Generated Form</h2>
      {template.sections.map((section) => (
        <div key={section.id} className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
          {section.fields.map((field) => (
            <div key={field.id} className="mb-3">
              <label className="block font-medium mb-1">{field.label}</label>
              {field.type === "text" && (
                <input
                  className="border p-2 rounded w-full"
                  value={formData[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                />
              )}
              {field.type === "number" && (
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={formData[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                />
              )}
              {field.type === "boolean" && (
                <input
                  type="checkbox"
                  checked={formData[field.id] || false}
                  onChange={(e) => handleChange(field.id, e.target.checked)}
                />
              )}
              {field.type === "enum" && (
                <select
                  className="border p-2 rounded w-full"
                  value={formData[field.id] || ""}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                >
                  <option value="">Select</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {field.type === "label" && (
                <div className="text-lg font-bold">{field.label}</div>
              )}
            </div>
          ))}
        </div>
      ))}
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
}

export default function App() {
  const [templates, setTemplates] = useState(() => {
    const stored = localStorage.getItem("templates");
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 flex gap-4">
        <Button onClick={() => setSelectedTemplate(null)}>
          Build Template
        </Button>
        {templates.map((t) => (
          <Button
            key={t.id}
            variant="outline"
            onClick={() => setSelectedTemplate(t)}
          >
            Use {t.name}
          </Button>
        ))}
      </div>
      {selectedTemplate ? (
        <DynamicForm template={selectedTemplate} />
      ) : (
        <TemplateBuilder />
      )}
    </div>
  );
}
