import { t } from '../../i18n';
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
  onDropbox,
}: {
  snapshot: ProjectSnapshot;
  flush: () => Promise<void>;
  onClose: () => void;
  defaultProfile: 'manuscript' | 'custom';
  onDropbox: () => void;
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
      label: t('dimensione_carattere_pt_98df74'),
      min: 8,
      max: 72,
      step: 1,
    },
    {
      key: 'lineSpacing',
      label: t('interlinea_docx_3d6dcb'),
      min: 1,
      max: 3,
      step: 0.1,
    },
    ...(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => ({
      key: `margin${side}` as keyof DocxProfile,
      label: {
        Top: t('export.marginTop'),
        Right: t('export.marginRight'),
        Bottom: t('export.marginBottom'),
        Left: t('export.marginLeft'),
      }[side],
      min: 0,
      max: 70,
      step: 1,
    })),
    {
      key: 'firstLineIndent',
      label: t('rientro_prima_riga_mm_5c0523'),
      min: 0,
      max: 40,
      step: 1,
    },
    {
      key: 'paragraphSpacing',
      label: t('spazio_dopo_paragrafo_pt_0d701a'),
      min: 0,
      max: 72,
      step: 1,
    },
    {
      key: 'chapterFontSize',
      label: t('dimensione_titolo_capitolo_pt_daf8b6'),
      min: 8,
      max: 72,
      step: 1,
    },
  ];
  return (
    <Modal
      title={t('esporta_e_crea_backup_287741')}
      onClose={onClose}
      protectContent={false}
    >
      <button type="button" onClick={onDropbox}>
        {t('dropbox.screen')}
      </button>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void execute();
        }}
      >
        <label>
          {t('formato_73e180')}
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
          >
            <option value="docx">{t('docx_f0abcf')}</option>
            <option value="txt">{t('txt_utf_8_30c2af')}</option>
            <option value="json">{t('backup_completo_json_ca72b9')}</option>
          </select>
        </label>
        {format === 'json' ? (
          <p>
            {t(
              'include_manoscritto_biblioteca_note_relazioni_cestino_e_impostazi_7930ca',
            )}
          </p>
        ) : (
          <>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={scoped}
                onChange={(event) => setScoped(event.target.checked)}
              />
              {t('esporta_solo_gli_elementi_selezionati_6773ed')}
            </label>
            {scoped && (
              <fieldset>
                <legend>{t('ambito_del_manoscritto_721dfc')}</legend>
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
              {t('includi_titolo_progetto_cbfa1f')}
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
              {t('includi_titoli_scene_5e2008')}
            </label>
            {format === 'txt' && (
              <label>
                {t('separatore_tra_capitoli_41eb66')}
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
              {t('profilo_056365')}
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
                <option value="manuscript">{t('manoscritto_bc53cf')}</option>
                <option value="custom">{t('personalizzato_792566')}</option>
              </select>
            </label>
            <label>
              {t('font_docx_8ad42c')}
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
                ['chapterBold', t('titoli_capitolo_in_grassetto_50f55a')],
                ['pageBreaks', t('nuova_pagina_per_capitolo_47987b')],
                ['pageNumbers', t('numeri_di_pagina_6c5d6e')],
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
              {t('intestazione_314af0')}
              <input
                value={profile.header}
                onChange={(event) =>
                  setProfile({ ...profile, header: event.target.value })
                }
              />
            </label>
            <label>
              {t('pie_di_pagina_2e8cd8')}
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
          {t(
            'il_backup_json_completo_include_anche_note_sinossi_e_schede_docx__5e1a62',
          )}
        </p>
        {error && <p role="alert">{error}</p>}
        <button
          className="filled-button"
          disabled={
            busy || (format !== 'json' && scoped && !options.scope.length)
          }
        >
          {busy ? t('generazione_f8fb50') : t('scarica_file_bee62f')}
        </button>
      </form>
    </Modal>
  );
}
