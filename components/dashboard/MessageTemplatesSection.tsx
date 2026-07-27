'use client';

import { useEffect, useState } from 'react';
import { templatesApi, type MessageTemplate } from '@/lib/api';
import { toast } from '@/lib/toast';
import { FileText, Loader2, Save, RotateCcw, Eye, ChevronDown, ChevronRight } from 'lucide-react';

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Nunca (usando el valor por defecto)';
  return new Date(dateStr).toLocaleString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function TemplateEditor({ template, onSaved }: { template: MessageTemplate; onSaved: (t: MessageTemplate) => void }) {
  const [content, setContent] = useState(template.content);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = content !== template.content;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await templatesApi.update(template.key, content);
      onSaved(updated);
      toast.success('Plantilla guardada');
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la plantilla');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('¿Restaurar esta plantilla a su texto por defecto? Se pierde el contenido editado.')) return;
    setResetting(true);
    setError(null);
    try {
      const updated = await templatesApi.reset(template.key);
      setContent(updated.content);
      onSaved(updated);
      toast.success('Plantilla restaurada al valor por defecto');
    } catch (err: any) {
      setError(err.message || 'No se pudo restaurar la plantilla');
    } finally {
      setResetting(false);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    setError(null);
    setPreview(null);
    try {
      const result = await templatesApi.preview(template.key, content);
      setPreview(result.preview);
    } catch (err: any) {
      setError(err.message || 'No se pudo generar la vista previa');
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setPreview(null); }}
        rows={14}
        spellCheck={false}
        className="w-full px-3 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded-lg text-gray-900 dark:text-gray-200 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-500/50"
      />

      <p className="text-xs text-gray-500">
        Usa <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{{{variable}}}'}</code> con triple
        llave para insertar texto, y <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{{#if variable}}...{{/if}}'}</code> para
        mostrar una sección solo si aplica.
      </p>

      {error && (
        <div className="text-sm text-red-700 dark:text-red-400 bg-red-600/10 border border-red-600/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {preview && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/40 p-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Vista previa (con datos de ejemplo):</p>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">{preview}</pre>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">Última actualización: {formatDate(template.updatedAt)}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
            Vista previa
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Restaurar default
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessageTemplatesSection() {
  const [templates, setTemplates] = useState<MessageTemplate[] | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await templatesApi.list();
      setTemplates(data);
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron cargar las plantillas');
    } finally {
      setLoading(false);
    }
  }

  function handleSaved(updated: MessageTemplate) {
    setTemplates((prev) => prev?.map((t) => (t.key === updated.key ? updated : t)) ?? prev);
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 max-w-2xl">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Plantillas de mensajes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Edita el texto de los mensajes de WhatsApp sin necesidad de tocar código ni hacer deploy.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="space-y-2">
          {templates?.map((template) => {
            const isOpen = expandedKey === template.key;
            return (
              <div key={template.key} className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedKey(isOpen ? null : template.key)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{template.description}</span>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700/50">
                    <TemplateEditor template={template} onSaved={handleSaved} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
