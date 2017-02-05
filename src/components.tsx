import * as React from "react"
import { render } from "react-dom"

interface npProps {
  noBack: boolean,
  noNext: boolean
}

function NaviPanel(props: npProps) {
  return (
    <div id="navi_panel">
      <button id="navi_back" disabled={props.noBack}>{"< BACK"}</button>
      <button id="navi_next" disabled={props.noNext}>{"NEXT >"}</button>
    </div>
  );
}

export function renderNaviPanel(doc: Document, i, n) {
  render(<NaviPanel noBack={i===0} noNext={i===(n-1)} />,
                  doc.getElementById("navi_panel"));
}
