import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, lineHeight: 1.55, color: "#1a1a1a" },
  meta: { fontSize: 9, color: "#8a8a8a", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 28, marginBottom: 18, fontFamily: "Times-Roman" },
  byline: { fontSize: 10, color: "#666", marginBottom: 24 },
  section: { marginBottom: 14 },
  h2: { fontSize: 13, fontFamily: "Times-Bold", marginBottom: 4 },
  body: { fontSize: 11, lineHeight: 1.6 },
  footer: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#aaa", textAlign: "center" },
});

interface ExportPayload {
  kind: "story" | "keynote" | "podcast" | "book" | "sermon";
  title: string;
  author?: string;
  body?: string;
  sections?: { heading: string; body: string }[];
}

function StoryDoc({ payload }: { payload: ExportPayload }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.meta}>{payload.kind}</Text>
        <Text style={styles.title}>{payload.title}</Text>
        {payload.author && <Text style={styles.byline}>by {payload.author}</Text>}
        {payload.body && (
          <View style={styles.section}><Text style={styles.body}>{payload.body}</Text></View>
        )}
        {payload.sections?.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.h2}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
        <Text style={styles.footer} fixed>Storyou · {new Date().toLocaleDateString()}</Text>
      </Page>
    </Document>
  );
}

export async function downloadAsPdf(payload: ExportPayload) {
  const blob = await pdf(<StoryDoc payload={payload} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
