import { useState } from 'react';
import {
  type Preferences,
  savePreferences,
} from '../../modules/settings/preferences';
import { Modal } from '../common/Modal';

export function LocalPreferences({
  preferences,
  onClose,
}: {
  preferences: Preferences;
  onClose: () => void;
}) {
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
      title="Preferenze di scrittura"
      onClose={onClose}
      protectContent={false}
    >
      <p>
        <a href="/third-party-notices.txt" target="_blank" rel="noreferrer">
          Licenze delle dipendenze
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
          Tema
          <select
            value={value.theme}
            onChange={(event) =>
              setValue({
                ...value,
                theme: event.target.value as Preferences['theme'],
              })
            }
          >
            <option value="system">Sistema</option>
            <option value="light">Chiaro</option>
            <option value="dark">Scuro</option>
          </select>
        </label>
        <label>
          Carattere dell’editor
          <select
            value={value.font}
            onChange={(event) =>
              setValue({
                ...value,
                font: event.target.value as Preferences['font'],
              })
            }
          >
            <option value="Georgia">Georgia</option>
            <option value="system-ui">Sistema</option>
            <option value="monospace">Monospazio</option>
          </select>
        </label>
        <label>
          Dimensione testo (px)
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
          Interlinea
          <input
            type="number"
            min={1.2}
            max={2.4}
            step={0.05}
            value={value.lineHeight}
            onChange={(event) =>
              setValue({ ...value, lineHeight: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Larghezza testo (px)
          <input
            type="number"
            min={400}
            max={1000}
            step={20}
            value={value.textWidth}
            onChange={(event) =>
              setValue({ ...value, textWidth: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Velocità lettura (parole/minuto)
          <input
            type="number"
            min={80}
            max={600}
            value={value.readingSpeed}
            onChange={(event) =>
              setValue({ ...value, readingSpeed: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Ritardo autosalvataggio (ms)
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
          Profilo predefinito di esportazione
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
            <option value="manuscript">Manoscritto</option>
            <option value="custom">Ultimo personalizzato del progetto</option>
          </select>
        </label>
        <fieldset>
          <legend>Tipografia automatica</legend>
          {(
            [
              ['italian', "e' → è"],
              ['apostrophe', 'Apostrofi italiani'],
              ['ellipsis', 'Tre punti → ellissi'],
              ['spaces', 'Spazi ripetuti'],
              ['capitalization', 'Maiuscole dopo frasi non ambigue'],
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
            Trattini
            <select
              value={value.dash}
              onChange={(event) =>
                setValue({
                  ...value,
                  dash: event.target.value as Preferences['dash'],
                })
              }
            >
              <option value="off">Nessuna sostituzione</option>
              <option value="en">Lineetta media –</option>
              <option value="em">Lineetta lunga —</option>
            </select>
          </label>
          <label>
            Acronimi ignorati (separati da virgola)
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
          {busy ? 'Salvataggio…' : 'Salva preferenze'}
        </button>
      </form>
    </Modal>
  );
}
