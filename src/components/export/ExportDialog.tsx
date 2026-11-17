import { DropboxPanel } from '../dropbox/DropboxPanel';
import { useState } from 'react';
import { db, readProject } from '../../database/db';
import type { ProjectSnapshot } from '../../modules/manuscript/model';
import {
  defaultExportOptions,
  safeFilename,
  toTxt,
  type ExportOptions,
} from '../../modules/export/manuscript';
import {
  manuscriptProfile,
  type DocxProfile,
} from '../../modules/export/profile';
import { exportBackup } from '../../modules/backup/backup';
import { download } from '../../modules/export/download';
import { projectService } from '../../modules/storage/project-service';
import { Modal } from '../common/Modal';

export function ExportDialog({
  snapshot,
  flush,
  onClose,
  defaultProfile,
}: {
  snapshot: ProjectSnapshot;
  flush: () => Promise<void>;
  onClose: () => void;
  defaultProfile: 'manuscript' | 'custom';
}) {
  const [format, setFormat] = useState('docx');
  const [options, setOptions] = useState<ExportOptions>(defaultExportOptions);
  const [profile, setProfile] = useState<DocxProfile>(() => {
    if (defaultProfile === 'manuscript') {
      return manuscriptProfile;
    }
    try {
      return {
        ...manuscriptProfile,
        ...JSON.parse(snapshot.settings.exportProfile ?? '{}'),
      };
    } catch {
      return manuscriptProfile;
    }
  });
  const [preset, setPreset] = useState(defaultProfile);
  const [scoped, setScoped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function execute() {
    setBusy(true);
    setError('');
    try {
      await flush();
      const latest = await db.transaction('r', db.projectTables, () =>
        readProject(db, snapshot.project.id),
      );
      const name = safeFilename(latest.project.title);
      const scopeOptions = { ...options, scope: scoped ? options.scope : [] };
      if (format === 'json') {
        download(
          new Blob([await exportBackup(db, latest.project.id)], {
            type: 'application/json',
          }),
          `${name}.genowrite3.json`,
        );
      } else if (format === 'txt') {
        download(
          new Blob([toTxt(latest, scopeOptions)], {
            type: 'text/plain;charset=utf-8',
          }),
          `${name}.txt`,
        );
      } else {
        const { toDocx } = await import('../../modules/export/docx');
        download(await toDocx(latest, scopeOptions, profile), `${name}.docx`);
      }
      await projectService.mutate(latest.project.id, (state) => {
        state.settings.exportProfile = JSON.stringify(profile);
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }
  const numberFields: {
    key: keyof DocxProfile;
    label: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    {
      key: 'fontSize',
      label: 'Dimensione carattere (pt)',
      min: 8,
      max: 72,
      step: 1,
    },
    { key: 'lineSpacing', label: 'Interlinea DOCX', min: 1, max: 3, step: 0.1 },
    ...(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => ({
      key: `margin${side}` as keyof DocxProfile,
      label: `Margine ${{ Top: 'superiore', Right: 'destro', Bottom: 'inferiore', Left: 'sinistro' }[side]} (mm)`,
      min: 0,
      max: 70,
      step: 1,
    })),
    {
      key: 'firstLineIndent',
      label: 'Rientro prima riga (mm)',
      min: 0,
      max: 40,
      step: 1,
    },
    {
      key: 'paragraphSpacing',
      label: 'Spazio dopo paragrafo (pt)',
      min: 0,
      max: 72,
      step: 1,
    },
    {
      key: 'chapterFontSize',
      label: 'Dimensione titolo capitolo (pt)',
      min: 8,
      max: 72,
      step: 1,
    },
  ];
  return (
    <Modal
      title="Esporta e crea backup"
      onClose={onClose}
      protectContent={false}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void execute();
        }}
      >
        <label>
          Formato
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="docx">DOCX</option>
            <option value="txt">TXT UTF-8</option>
            <option value="json">Backup completo JSON</option>
          </select>
        </label>
        {format === 'json' && (
          <DropboxPanel
            prepareExport={async () => {
              await flush();
              return exportBackup(db, snapshot.project.id);
            }}
          />
        )}
        {format === 'json' ? (
          <p>
            Include manoscritto, biblioteca, note, relazioni, cestino e
            impostazioni del progetto. Le preferenze globali dell’app sono
            escluse.
          </p>
        ) : (
          <>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scoped}
                onChange={(event) => setScoped(event.target.checked)}
              />
              Esporta solo gli elementi selezionati
            </label>
            {scoped && (
              <fieldset>
                <legend>Ambito del manoscritto</legend>
                {snapshot.nodes
                  .filter(
                    (node) =>
                      !node.deletedAt &&
                      ['volume', 'part', 'chapter'].includes(node.type),
                  )
                  .map((node) => (
                    <label className="checkbox-label" key={node.id}>
                      <input
                        type="checkbox"
                        checked={options.scope.includes(node.id)}
                        onChange={(event) =>
                          setOptions({
                            ...options,
                            scope: event.target.checked
                              ? [...options.scope, node.id]
                              : options.scope.filter((id) => id !== node.id),
                          })
                        }
                      />
                      {node.title}
                    </label>
                  ))}
              </fieldset>
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.includeProjectTitle}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    includeProjectTitle: event.target.checked,
                  })
                }
              />
              Includi titolo progetto
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.includeSceneTitles}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    includeSceneTitles: event.target.checked,
                  })
                }
              />
              Includi titoli scene
            </label>
            {format === 'txt' && (
              <label>
                Separatore tra capitoli
                <input
                  value={options.chapterSeparator}
                  onChange={(event) =>
                    setOptions({
                      ...options,
                      chapterSeparator: event.target.value,
                    })
                  }
                />
              </label>
            )}
          </>
        )}
        {format === 'docx' && (
          <>
            <label>
              Profilo
              <select
                value={preset}
                onChange={(event) => {
                  setPreset(
                    event.target.value === 'custom' ? 'custom' : 'manuscript',
                  );
                  if (event.target.value === 'manuscript') {
                    setProfile(manuscriptProfile);
                  }
                }}
              >
                <option value="manuscript">Manoscritto</option>
                <option value="custom">Personalizzato</option>
              </select>
            </label>
            <label>
              Font DOCX
              <input
                value={profile.font}
                onChange={(event) => {
                  setPreset('custom');
                  setProfile({ ...profile, font: event.target.value });
                }}
                required
              />
            </label>
            {numberFields.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={String(profile[field.key])}
                  onChange={(event) => {
                    setPreset('custom');
                    setProfile({
                      ...profile,
                      [field.key]: Number(event.target.value),
                    });
                  }}
                />
              </label>
            ))}
            {(
              [
                ['chapterBold', 'Titoli capitolo in grassetto'],
                ['pageBreaks', 'Nuova pagina per capitolo'],
                ['pageNumbers', 'Numeri di pagina'],
              ] as const
            ).map(([key, label]) => (
              <label className="checkbox-label" key={key}>
                <input
                  type="checkbox"
                  checked={profile[key]}
                  onChange={(event) =>
                    setProfile({ ...profile, [key]: event.target.checked })
                  }
                />
                {label}
              </label>
            ))}
            <label>
              Intestazione
              <input
                value={profile.header}
                onChange={(event) =>
                  setProfile({ ...profile, header: event.target.value })
                }
              />
            </label>
            <label>
              Piè di pagina
              <input
                value={profile.footer}
                onChange={(event) =>
                  setProfile({ ...profile, footer: event.target.value })
                }
              />
            </label>
          </>
        )}
        <p>
          Note, sinossi e schede non sono incluse nel manoscritto. La
          generazione avviene sul dispositivo.
        </p>
        {error && <p role="alert">{error}</p>}
        <button
          className="filled-button"
          disabled={
            busy || (format !== 'json' && scoped && !options.scope.length)
          }
        >
          {busy ? 'Generazione…' : 'Scarica file'}
        </button>
      </form>
    </Modal>
  );
}
