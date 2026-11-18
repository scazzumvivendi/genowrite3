import { t } from '../../i18n';
import { useState } from 'react';
import {
  type Preferences,
  savePreferences,
} from '../../modules/settings/preferences';
import { Modal } from '../common/Modal';
import { useInstall } from '../../app/pwa/install';

export function LocalPreferences({
  preferences,
  onClose,
}: {
  preferences: Preferences;
  onClose: () => void;
}) {
  const install = useInstall();
  const [value, setValue] = useState(preferences);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await savePreferences(value);
      onClose();
    } catch (reason) {
      setError(String(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t('preferenze_di_scrittura_f84136')}
      onClose={onClose}
      protectContent={false}
    >
      {install && (
        <button type="button" onClick={() => void install()}>
          {t('installa_genowrite_e2e0d3')}
        </button>
      )}
      <p>
        <a
          href={`${import.meta.env.BASE_URL}third-party-notices.txt`}
          target="_blank"
          rel="noreferrer"
        >
          {t('licenze_delle_dipendenze_9b942e')}
        </a>
      </p>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <label>
          {t('tema_d5df37')}
          <select
            value={value.theme}
            onChange={(event) =>
              setValue({
                ...value,
                theme: event.target.value as Preferences['theme'],
              })
            }
          >
            <option value="system">{t('sistema_f150af')}</option>
            <option value="light">{t('chiaro_8f1b4e')}</option>
            <option value="dark">{t('scuro_316022')}</option>
          </select>
        </label>
        <label>
          {t('carattere_dell_editor_0fa595')}
          <select
            value={value.font}
            onChange={(event) =>
              setValue({
                ...value,
                font: event.target.value as Preferences['font'],
              })
            }
          >
            <option value="Georgia">{t('georgia_469149')}</option>
            <option value="system-ui">{t('sistema_f150af')}</option>
            <option value="monospace">{t('monospazio_de8f68')}</option>
          </select>
        </label>
        <label>
          {t('dimensione_testo_px_e7c926')}
          <input
            type="number"
            min={14}
            max={32}
            value={value.fontSize}
            onChange={(event) =>
              setValue({ ...value, fontSize: Number(event.target.value) })
            }
          />
        </label>
        <label>
          {t('interlinea_377aec')}
          <input
            type="number"
            min={1}
            max={2.4}
            step={0.05}
            value={value.lineHeight}
            onChange={(event) =>
              setValue({ ...value, lineHeight: Number(event.target.value) })
            }
          />
        </label>
        <label>
          {t('larghezza_testo_px_a83c63')}
          <input
            type="number"
            min={400}
            max={2400}
            step={20}
            value={value.textWidth}
            onChange={(event) =>
              setValue({ ...value, textWidth: Number(event.target.value) })
            }
          />
        </label>
        <label>
          {t('ritardo_autosalvataggio_ms_58c079')}
          <input
            type="number"
            min={300}
            max={2000}
            step={100}
            value={value.autosaveDelay}
            onChange={(event) =>
              setValue({ ...value, autosaveDelay: Number(event.target.value) })
            }
          />
        </label>
        <label>
          {t('profilo_predefinito_di_esportazione_3fcdb2')}
          <select
            value={value.defaultExportProfile}
            onChange={(event) =>
              setValue({
                ...value,
                defaultExportProfile: event.target
                  .value as Preferences['defaultExportProfile'],
              })
            }
          >
            <option value="manuscript">{t('manoscritto_bc53cf')}</option>
            <option value="custom">
              {t('ultimo_personalizzato_del_progetto_9038f9')}
            </option>
          </select>
        </label>
        <fieldset>
          <legend>{t('tipografia_automatica_0e9dc1')}</legend>
          {(
            [
              ['italian', t('preferences.italianAccent')],
              ['apostrophe', t('apostrofi_italiani_967eed')],
              ['ellipsis', t('tre_punti_ellissi_a649bb')],
              ['spaces', t('spazi_ripetuti_d039c6')],
              ['capitalization', t('maiuscole_dopo_frasi_non_ambigue_c67a5d')],
            ] as const
          ).map(([key, label]) => (
            <label className="checkbox-label" key={key}>
              <input
                type="checkbox"
                checked={value[key]}
                onChange={(event) =>
                  setValue({ ...value, [key]: event.target.checked })
                }
              />
              {label}
            </label>
          ))}
          <label>
            {t('trattini_a117b0')}
            <select
              value={value.dash}
              onChange={(event) =>
                setValue({
                  ...value,
                  dash: event.target.value as Preferences['dash'],
                })
              }
            >
              <option value="off">{t('nessuna_sostituzione_76b6ff')}</option>
              <option value="en">{t('lineetta_media_fc1726')}</option>
              <option value="em">{t('lineetta_lunga_a7fce8')}</option>
            </select>
          </label>
          <label>
            {t('acronimi_ignorati_separati_da_virgola_a5dcda')}
            <input
              value={value.acronymExceptions.join(',')}
              onChange={(event) =>
                setValue({
                  ...value,
                  acronymExceptions: event.target.value
                    .split(',')
                    .map((word) => word.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
        </fieldset>
        <button className="filled-button" disabled={busy}>
          {busy ? t('salvataggio_c4f57f') : t('salva_preferenze_0c25ea')}
        </button>
      </form>
    </Modal>
  );
}
