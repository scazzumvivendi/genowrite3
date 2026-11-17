export interface DocxProfile {
  font: string;
  fontSize: number;
  lineSpacing: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  firstLineIndent: number;
  paragraphSpacing: number;
  chapterFontSize: number;
  chapterBold: boolean;
  pageBreaks: boolean;
  pageNumbers: boolean;
  header: string;
  footer: string;
}
export const manuscriptProfile: DocxProfile = {
  font: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 1.5,
  marginTop: 25,
  marginRight: 25,
  marginBottom: 25,
  marginLeft: 25,
  firstLineIndent: 5,
  paragraphSpacing: 6,
  chapterFontSize: 18,
  chapterBold: true,
  pageBreaks: true,
  pageNumbers: true,
  header: '',
  footer: '',
};
