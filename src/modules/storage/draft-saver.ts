import type { JSONContent } from '@tiptap/core';
import type { ProjectService } from './project-service';

export type SaveState = 'saved' | 'pending' | 'saving' | 'error';
interface PendingWrite {
  content: JSONContent;
  revision: number;
}

/** Una coda per sessione: nessuna scrittura può sorpassarne un'altra. */
export class DraftSaver {
  private revisions = new Map<string, number>();
  private writes = new Map<string, PendingWrite>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<void> | undefined;
  constructor(
    private service: ProjectService,
    private notify: (state: SaveState, message?: string) => void,
    private delay = 600,
  ) {}

  get dirty() {
    return this.writes.size > 0;
  }

  enqueue(id: string, content: JSONContent, revision: number) {
    const previous = this.writes.get(id);
    this.writes.set(id, {
      content,
      revision: previous?.revision ?? this.revisions.get(id) ?? revision,
    });
    clearTimeout(this.timer);
    this.notify('pending');
    this.timer = setTimeout(() => {
      void this.flush().catch(() => undefined);
    }, this.delay);
  }

  flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.running) {
      return this.running;
    }
    this.running = this.persist().finally(() => {
      this.running = undefined;
    });
    return this.running;
  }

  private async persist() {
    try {
      while (this.writes.size) {
        const [id, write] = this.writes.entries().next().value!;
        this.notify('saving');
        const revision = await this.service.saveDocument(
          id,
          write.content,
          write.revision,
        );
        this.revisions.set(id, revision);
        if (this.writes.get(id) === write) {
          this.writes.delete(id);
        } else {
          this.writes.get(id)!.revision = revision;
        }
      }
      this.notify('saved');
    } catch (error) {
      this.notify(
        'error',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  openDocument(id: string, revision: number) {
    if (!this.writes.has(id)) {
      this.revisions.set(id, revision);
    }
  }

  pendingContent() {
    return new Map(
      [...this.writes].map(([id, write]) => [
        id,
        structuredClone(write.content),
      ]),
    );
  }

  setDelay(delay: number) {
    this.delay = delay;
  }

  stopTimer() {
    clearTimeout(this.timer);
  }
}
