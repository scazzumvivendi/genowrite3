import { t } from '../../i18n';
import { useEffect, useRef } from 'react';
import type {
  ManuscriptDocument,
  ManuscriptNode,
} from '../../modules/manuscript/model';
import type { DraftSaver } from '../../modules/storage/draft-saver';
import type { Preferences } from '../../modules/settings/preferences';
import { countContent } from '../../modules/statistics/counts';
import {
  publishCounts,
  clearLiveCounts,
} from '../../modules/statistics/live-counts';
import { WritingEditor } from './WritingEditor';

export function LocalDocument({
  node,
  document,
  saver,
  preferences,
}: {
  node: ManuscriptNode;
  document: ManuscriptDocument;
  saver: DraftSaver;
  preferences: Preferences;
}) {
  const baseRevision = useRef(document.revision);
  const settings = useRef(preferences);
  useEffect(() => {
    settings.current = preferences;
  }, [preferences]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    saver.openDocument(document.id, document.revision);
    publishCounts(document.id, countContent(document.content));
    return () => {
      clearTimeout(timer.current);
      clearLiveCounts(document.id);
    };
    // Le successive modifiche vengono pubblicate direttamente da onChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id]);
  return (
    <div
      className="local-editor-host"
      style={
        {
          '--editor-font': preferences.font,
          '--editor-size': `${preferences.fontSize}px`,
          '--editor-line-height': preferences.lineHeight,
          '--editor-width': `${preferences.textWidth + 112}px`,
        } as React.CSSProperties
      }
    >
      <WritingEditor
        document={{
          title: node.title,
          kind:
            node.type === 'scene' ? t('scena_48829c') : t('capitolo_288e49'),
          path:
            node.type === 'scene'
              ? t('document.path.scene')
              : t('capitolo_288e49'),
        }}
        content={document.content}
        rules={() => settings.current}
        diagnosticSettings={preferences}
        onChange={(content) => {
          saver.enqueue(document.id, content, baseRevision.current);
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => publishCounts(document.id, countContent(content)),
            120,
          );
        }}
      />
    </div>
  );
}
