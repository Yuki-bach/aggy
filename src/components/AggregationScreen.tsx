import { useEffect, useRef, useState } from "preact/hooks";
import type { Tab } from "../lib/agg/types";
import ResultPanel from "./aggregation/ResultPanel";
import SettingsPanel from "./aggregation/SettingsPanel";
import { runAggregation } from "../lib/duckdb";
import type { Layout } from "../lib/layout";
import { buildQuestions, findWeightColumn } from "../lib/layout";
import { t } from "../lib/i18n";
import type { RawData, LayoutData } from "../lib/types";

interface AggregationScreenProps {
  rawData: RawData;
  layout: LayoutData;
  preparedLayout: Layout;
  dateWarnings: string[];
}

export default function AggregationScreen({
  rawData,
  layout,
  preparedLayout,
  dateWarnings,
}: AggregationScreenProps) {
  const questions = buildQuestions(preparedLayout);
  const weightCol = findWeightColumn(preparedLayout);

  const [crossSelected, setCrossSelected] = useState<Record<string, boolean>>({});
  const [weightEnabled, setWeightEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [aggResult, setAggResult] = useState<{ tabs: Tab[]; weightCol: string } | null>(null);

  const didAutoRun = useRef(false);
  useEffect(() => {
    if (!didAutoRun.current) {
      didAutoRun.current = true;
      const sel: Record<string, boolean> = {};
      questions.forEach((q) => (sel[q.code] = false));
      setCrossSelected(sel);
      handleRunAggregation();
    }
  }, []);

  async function handleRunAggregation(): Promise<void> {
    setErrorMsg("");

    const activeWeightCol = weightEnabled ? weightCol : "";
    const crossQuestions = questions.filter((q) => crossSelected[q.code]);

    try {
      const tabs = await runAggregation(questions, crossQuestions, activeWeightCol);
      setAggResult({ tabs, weightCol: activeWeightCol });
    } catch (e) {
      setErrorMsg(t("error.aggregation", { msg: (e as Error).message }));
    }
  }

  return (
    <>
      <SettingsPanel
        rawData={rawData}
        layout={layout}
        preparedLayout={preparedLayout}
        questions={questions}
        crossSelected={crossSelected}
        onCrossToggle={(key, checked) => setCrossSelected((prev) => ({ ...prev, [key]: checked }))}
        weightCol={weightCol}
        weightEnabled={weightEnabled}
        onWeightToggle={setWeightEnabled}
        dateWarnings={dateWarnings}
        errorMsg={errorMsg}
        onRun={() => handleRunAggregation()}
      />

      <ResultPanel tabs={aggResult?.tabs ?? null} weightCol={aggResult?.weightCol ?? ""} />
    </>
  );
}
