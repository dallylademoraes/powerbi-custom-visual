/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;

import { VisualFormattingSettingsModel } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;
    private host: powerbi.extensibility.visual.IVisualHost;

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.formattingSettingsService = new FormattingSettingsService();
        this.host = options.host;
        this.target = options.element;
    }

public update(options: VisualUpdateOptions) {
    this.target.innerHTML = "";

    const dataView = options.dataViews?.[0];
    const categorical = dataView?.categorical;

    if (!categorical?.categories || categorical.categories.length < 2) {
        this.target.innerHTML = "Arraste campos para Eixo e Ano.";
        return;
    }

    this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
        VisualFormattingSettingsModel,
        dataView
    );

    const eixoValues = categorical.categories[0].values.map(v => String(v ?? ""));
    const anoValues  = categorical.categories[1].values.map(v => String(v ?? ""));

    // Medida opcional (se você estiver usando % no visual)
    const values = categorical.values?.[0]?.values?.map(v => Number(v)) ?? [];

    // eixo -> média (se tiver measure)
    const sumByEixo = new Map<string, number>();
    const countByEixo = new Map<string, number>();

    // (eixo, ano) -> média
    const sumByEixoAno = new Map<string, number>();
    const countByEixoAno = new Map<string, number>();

    function makeKey(eixo: string, ano: string): string {
        return `${eixo}||${ano}`;
    }

    for (let i = 0; i < eixoValues.length; i++) {
        const e = eixoValues[i];
        const a = anoValues[i];

        const v = values[i];
        if (!Number.isNaN(v)) {
            sumByEixo.set(e, (sumByEixo.get(e) ?? 0) + v);
            countByEixo.set(e, (countByEixo.get(e) ?? 0) + 1);

            const k = makeKey(e, a);
            sumByEixoAno.set(k, (sumByEixoAno.get(k) ?? 0) + v);
            countByEixoAno.set(k, (countByEixoAno.get(k) ?? 0) + 1);
        }
    }

    const eixos = Array.from(new Set(eixoValues))
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    const anos = Array.from(new Set(anoValues))
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            const aIsNum = Number.isFinite(na);
            const bIsNum = Number.isFinite(nb);

            if (aIsNum && bIsNum) return na - nb;
            if (aIsNum) return -1;
            if (bIsNum) return 1;
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });

    // Cores fixas (5 cores mais "sóbrias" e consistentes)
    function colorForYear(_year: string, index: number): string {
        const palette = ["#0F766E", "#2563EB", "#7C3AED", "#D97706", "#DC2626"];
        return palette[index % palette.length];
    }

    function toPct(v: number): number { return v <= 1 ? v * 100 : v; }
    function formatPercent(v: number | null): string {
        if (v === null) return "—";
        return `${toPct(v).toFixed(2)}%`;
    }

    function blendWithWhite(hex: string, amount: number): string {
        const cleaned = hex.replace("#", "").trim();
        const full = cleaned.length === 3
            ? `${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`
            : cleaned;
        if (full.length !== 6) return hex;

        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        const t = Math.max(0, Math.min(1, amount));

        const rr = Math.round(r + (255 - r) * t);
        const gg = Math.round(g + (255 - g) * t);
        const bb = Math.round(b + (255 - b) * t);

        const toHex2 = (n: number) => n.toString(16).padStart(2, "0");
        return `#${toHex2(rr)}${toHex2(gg)}${toHex2(bb)}`;
    }

    function intensityForPercent(percent: number): number {
        // 0 = cor "forte" (original), 1 = bem clara (quase branco)
        if (percent >= 85) return 0.0;
        if (percent >= 70) return 0.35;
        return 0.65;
    }

    const root = document.createElement("div");
    root.style.fontFamily = "Segoe UI";
    root.style.padding = "18px";
    root.style.boxSizing = "border-box";

    const baseFontSize = Math.max(10, this.formattingSettings?.dataPointCard?.fontSize?.value ?? 12);

    // Linhas
    for (const eixo of eixos) {
        const sum = sumByEixo.get(eixo) ?? 0;
        const cnt = countByEixo.get(eixo) ?? 0;
        const avg = cnt > 0 ? (sum / cnt) : null;

        const row = document.createElement("div");
        row.style.display = "grid";
        row.style.gridTemplateColumns = `90px 110px 1fr 56px`;
        row.style.alignItems = "center";
        row.style.gap = "12px";
        row.style.margin = "14px 0";

        // Eixo
        const label = document.createElement("div");
        label.textContent = eixo;
        label.style.fontWeight = "700";
        label.style.fontSize = `${baseFontSize}px`;
        label.style.color = "#222";

        // % médio (se measure existir)
        const pctBox = document.createElement("div");
        pctBox.textContent = formatPercent(avg);
        pctBox.style.fontWeight = "700";
        pctBox.style.fontSize = `${baseFontSize}px`;
        pctBox.style.color = "#222";

        // Barra + anos embaixo
        const barWrap = document.createElement("div");
        barWrap.style.display = "flex";
        barWrap.style.flexDirection = "column";
        barWrap.style.gap = "6px";

        const bar = document.createElement("div");
        bar.style.display = "flex";
        bar.style.width = "100%";
        bar.style.height = "36px";
        bar.style.borderRadius = "10px";
        bar.style.overflow = "hidden";
        bar.style.border = "1px solid #ddd";
        bar.style.position = "relative";

        let lastIdxWithValue = -1;
        anos.forEach((y, idx) => {
            const seg = document.createElement("div");
            seg.style.flex = "1";
            seg.title = `${eixo} - ${y}`;
            const k = makeKey(eixo, y);
            const c = countByEixoAno.get(k) ?? 0;
            if (c > 0) {
                lastIdxWithValue = Math.max(lastIdxWithValue, idx);
                const v = (sumByEixoAno.get(k) ?? 0) / c;
                const p = toPct(v);
                const base = colorForYear.call(this, y, idx);
                seg.style.background = blendWithWhite(base, intensityForPercent(p));
                seg.title = `${eixo} - ${y}: ${formatPercent(v)}`;
            } else {
                seg.style.background = "#f1f3f5";
                seg.title = `${eixo} - ${y}: sem valor`;
            }
            bar.appendChild(seg);
        });

        // Marcação do "próximo ano" (primeiro ano após o último com valor)
        const nextIdx = lastIdxWithValue >= 0 ? lastIdxWithValue + 1 : -1;
        if (nextIdx >= 0 && nextIdx < anos.length) {
            const marker = document.createElement("div");
            marker.style.position = "absolute";
            marker.style.top = "0";
            marker.style.bottom = "0";
            marker.style.left = `${(nextIdx / anos.length) * 100}%`;
            marker.style.width = "3px";
            marker.style.background = "#111";
            marker.style.opacity = "0.55";
            marker.style.pointerEvents = "none";
            marker.title = `Próximo ano: ${anos[nextIdx]}`;
            bar.appendChild(marker);
        }

        barWrap.appendChild(bar);

        // Emoji simples (mantém seu comportamento atual)
        const emo = document.createElement("div");
        // mantém sua regra antiga (se quiser mudar depois)
        if (avg === null) emo.textContent = "😶";
        else {
            const p = toPct(avg);
            emo.textContent = p >= 85 ? "😄" : (p >= 70 ? "🙂" : "😐");
        }
        emo.style.fontSize = `${Math.round(baseFontSize * 2.1)}px`;
        emo.style.textAlign = "center";
        emo.style.lineHeight = "1";

        row.appendChild(label);
        row.appendChild(pctBox);
        row.appendChild(barWrap);
        row.appendChild(emo);
        root.appendChild(row);
    }

    // Anos (apenas uma vez, embaixo de todas as barras)
    const footer = document.createElement("div");
    footer.style.display = "grid";
    footer.style.gridTemplateColumns = `90px 110px 1fr 56px`;
    footer.style.alignItems = "center";
    footer.style.gap = "12px";
    footer.style.marginTop = "8px";

    footer.appendChild(document.createElement("div"));
    footer.appendChild(document.createElement("div"));

    const yearsRow = document.createElement("div");
    yearsRow.style.display = "flex";
    yearsRow.style.width = "100%";
    yearsRow.style.color = "#666";
    yearsRow.style.fontSize = `${Math.max(10, baseFontSize - 1)}px`;
    yearsRow.style.userSelect = "none";

    anos.forEach((y) => {
        const yEl = document.createElement("div");
        yEl.textContent = y;
        yEl.style.flex = "1";
        yEl.style.textAlign = "center";
        yearsRow.appendChild(yEl);
    });

    footer.appendChild(yearsRow);
    footer.appendChild(document.createElement("div"));
    root.appendChild(footer);

    this.target.appendChild(root);
}

    /**
     * Returns properties pane formatting model content hierarchies, properties and latest formatting values, Then populate properties pane.
     * This method is called once every time we open properties pane or when the user edit any format property. 
     */
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
