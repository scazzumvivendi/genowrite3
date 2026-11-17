import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  TextRun,
  UnderlineType,
} from 'docx';
import type { ProjectSnapshot } from '../manuscript/model';
import {
  manuscriptBlocks,
  type ExportOptions,
  type TextSegment,
} from './manuscript';

import { type DocxProfile } from './profile';
function mm(value: number) {
  return Math.round((value * 1440) / 25.4);
}
function textRuns(segment: TextSegment) {
  return segment.text.split('\n').map(
    (text, index) =>
      new TextRun({
        text,
        ...(index ? { break: 1 } : {}),
        bold: Boolean(segment.bold),
        italics: Boolean(segment.italic),
        strike: Boolean(segment.strike),
        ...(segment.underline
          ? { underline: { type: UnderlineType.SINGLE } }
          : {}),
      }),
  );
}
export function buildDocx(
  snapshot: ProjectSnapshot,
  options: ExportOptions,
  profile: DocxProfile,
) {
  if (
    typeof profile.font !== 'string' ||
    !profile.font.trim() ||
    profile.font.length > 100 ||
    typeof profile.header !== 'string' ||
    typeof profile.footer !== 'string' ||
    [profile.chapterBold, profile.pageBreaks, profile.pageNumbers].some(
      (value) => typeof value !== 'boolean',
    )
  ) {
    throw new Error('Profilo DOCX non valido.');
  }
  const numbers = [
    profile.fontSize,
    profile.lineSpacing,
    profile.marginTop,
    profile.marginRight,
    profile.marginBottom,
    profile.marginLeft,
    profile.firstLineIndent,
    profile.paragraphSpacing,
    profile.chapterFontSize,
  ];
  if (
    numbers.some((number) => !Number.isFinite(number) || number < 0) ||
    profile.fontSize < 8 ||
    profile.fontSize > 72 ||
    profile.lineSpacing < 1 ||
    profile.lineSpacing > 3 ||
    Math.max(
      profile.marginLeft,
      profile.marginRight,
      profile.marginTop,
      profile.marginBottom,
    ) > 70
  ) {
    throw new Error('Profilo DOCX non valido.');
  }
  const blocks = manuscriptBlocks(snapshot, options);
  const listDefinitions = new Map<
    string,
    NonNullable<(typeof blocks)[number]['list']>
  >();
  for (const block of blocks) {
    if (block.list) {
      listDefinitions.set(block.list.reference, block.list);
    }
  }
  const children = blocks.map(
    (block) =>
      new Paragraph({
        children: block.runs.flatMap(textRuns),
        ...(block.heading === 'chapter'
          ? { style: 'ChapterTitle', pageBreakBefore: profile.pageBreaks }
          : block.heading
            ? {
                heading:
                  block.level === 3
                    ? HeadingLevel.HEADING_3
                    : block.heading === 'part' || block.level === 2
                      ? HeadingLevel.HEADING_2
                      : HeadingLevel.HEADING_1,
              }
            : {}),
        ...(block.list
          ? {
              numbering: {
                reference: block.list.reference,
                level: Math.min(block.list.level, 8),
              },
            }
          : {}),
        ...(!block.heading && !block.list
          ? {
              indent: {
                firstLine:
                  block.listContinuationLevel !== undefined
                    ? 0
                    : mm(profile.firstLineIndent),
                ...(block.listContinuationLevel !== undefined
                  ? {
                      left:
                        720 * (Math.min(block.listContinuationLevel, 8) + 1),
                    }
                  : block.quote
                    ? { left: mm(10) }
                    : {}),
              },
            }
          : {}),
      }),
  );
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun(profile.footer),
          ...(profile.pageNumbers
            ? [new TextRun({ children: [' ', PageNumber.CURRENT] })]
            : []),
        ],
      }),
    ],
  });
  return new Document({
    title: snapshot.project.title,
    creator: snapshot.project.author,
    styles: {
      default: {
        document: {
          run: { font: profile.font, size: profile.fontSize * 2 },
          paragraph: {
            spacing: {
              line: Math.round(profile.lineSpacing * 240),
              after: profile.paragraphSpacing * 20,
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'ChapterTitle',
          name: 'Chapter title',
          basedOn: 'Heading1',
          next: 'Normal',
          run: { size: profile.chapterFontSize * 2, bold: profile.chapterBold },
          paragraph: { spacing: { before: 240, after: 240 } },
        },
      ],
    },
    numbering: {
      config: [...listDefinitions.values()].map((list) => ({
        reference: list.reference,
        levels: Array.from({ length: 9 }, (_, level) => ({
          level,
          format: list.ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
          text: list.ordered ? `%${level + 1}.` : '•',
          start: list.start,
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } },
          },
        })),
      })),
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: mm(profile.marginTop),
              right: mm(profile.marginRight),
              bottom: mm(profile.marginBottom),
              left: mm(profile.marginLeft),
            },
          },
        },
        headers: {
          default: new Header({ children: [new Paragraph(profile.header)] }),
        },
        footers: { default: footer },
        children,
      },
    ],
  });
}
export async function toDocx(
  snapshot: ProjectSnapshot,
  options: ExportOptions,
  profile: DocxProfile,
) {
  return Packer.toBlob(buildDocx(snapshot, options, profile));
}
