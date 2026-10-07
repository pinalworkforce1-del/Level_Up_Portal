from pathlib import Path


def replace_required(text, old, new, label):
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f"Career Tree Lightcast patch could not find: {label}")
    return text.replace(old, new, 1)


# -----------------------------------------------------------------------------
# Career Tree XP model: optional Career Exploration XP, 550 max.
# 125 O*NET + 100 Alignment + 200 LMI + 125 Career Tree = 550.
# -----------------------------------------------------------------------------
base_path = Path("public/career-skill-tree/app-base.js")
base = base_path.read_text(encoding="utf-8")
base = replace_required(base, "state.xp=Math.max(state.xp,100);", "state.xp=Math.max(state.xp,125);", "O*NET XP")
base = replace_required(base, "state.xp=Math.max(state.xp,250);", "state.xp=Math.max(state.xp,225);", "alignment XP")
base = replace_required(base, "state.xp=Math.max(state.xp,450);", "state.xp=Math.max(state.xp,425);", "LMI XP")
base = replace_required(base, "state.xp=Math.max(state.xp,600);", "state.xp=Math.max(state.xp,550);", "Career Tree XP")
base = base.replace('placeholder="OEO / O*NET / other + year"', 'placeholder="Lightcast / O*NET / other + year"')
base_path.write_text(base, encoding="utf-8")


# -----------------------------------------------------------------------------
# Participant-facing LMI explorer: Lightcast is the primary LMI layer.
# O*NET remains taxonomy / RIASEC; CareerOneStop remains video.
# -----------------------------------------------------------------------------
explorer_path = Path("public/career-skill-tree/az-lmi-explorer.js")
explorer = explorer_path.read_text(encoding="utf-8")
explorer = replace_required(explorer, "const DATA_URL='data/az-lmi.json';", "const DATA_URL='data/lightcast-lmi.json';", "Lightcast data URL")

explorer = replace_required(
    explorer,
    "  function geographicOptions(){return Object.entries(lmiData?.geographies||{}).map(([k,v])=>`<option value=\"${esc(k)}\" ${state.lmi.explorer.geography===k?'selected':''}>${esc(v.label)}</option>`).join('')}",
    "  function entryArea(){return localStorage.getItem('level-up-pending-county')||state?.profile?.county||''}\n  function allowedGeoKeys(){const area=entryArea();const scoped=lmiData?.areas?.[area];return Array.isArray(scoped)&&scoped.length?scoped:Object.keys(lmiData?.geographies||{})}\n  function geographicOptions(){const allowed=new Set(allowedGeoKeys());return Object.entries(lmiData?.geographies||{}).filter(([k])=>allowed.has(k)).map(([k,v])=>`<option value=\"${esc(k)}\" ${state.lmi.explorer.geography===k?'selected':''}>${esc(v.label)}</option>`).join('')}",
    "area-scoped geography selector",
)

explorer = replace_required(
    explorer,
    "  function sourceMetric(o,geo){return lmiData?.geographies?.[geo]?.occupations?.[getOccCode(o)]||{}}",
    "  function sourceMetric(o,geo){const code=getOccCode(o);const soc=String(code||'').split('.')[0];const rows=lmiData?.geographies?.[geo]?.occupations||{};return rows[code]||rows[soc]||{}}",
    "SOC/O*NET occupation key fallback",
)

explorer = explorer.replace("Occupation-level OEO values for ${esc(g?.label||'this geography')} are not loaded yet. Career Tree will not substitute a broader number and label it as county-specific.", "Lightcast occupation values for ${esc(g?.label||'this geography')} are not loaded yet. Career Tree will not substitute another geography and label it as local data.")
explorer = explorer.replace("const wageSource=lmiData?.wageSource,projSource=lmiData?.projectionSource;", "const provider=lmiData?.provider||'Lightcast';")
explorer = explorer.replace("<a href=\"${esc(wageSource?.url||'#')}\" target=\"_blank\" rel=\"noopener\">Arizona OEO wages ↗</a><a href=\"${esc(projSource?.url||'#')}\" target=\"_blank\" rel=\"noopener\">Arizona OEO projections ↗</a>", "<span>${esc(provider)} labor-market snapshot • ${esc(lmiData?.snapshotYear||'annual')}</span>")
explorer = explorer.replace("county wages/employment can be county-specific when OEO publishes them. Growth/openings may use a broader workforce-area or statewide projection, and Career Tree will label that geography explicitly.", "every Lightcast value stays attached to the geography in the annual export. Career Tree will never relabel a statewide or different-county value as local data.")
explorer_path.write_text(explorer, encoding="utf-8")


# -----------------------------------------------------------------------------
# Page language / source labels.
# -----------------------------------------------------------------------------
index_path = Path("public/career-skill-tree/index.html")
index = index_path.read_text(encoding="utf-8")
index = index.replace(
    '<section class="lmi-workbench"><div class="section-title"><span class="eyebrow">YOUR SAVED CAREERS</span><h2>Capture the evidence that matters.</h2><p>Your saved occupations flow here for deeper investigation and eventually into My Career Tree.</p></div><div id="lmiCareerTabs" class="tab-row"></div><div id="lmiCareerPanel"></div><div class="official-links"><a href="https://oeo.az.gov/labor-market/occupation-employment" target="_blank" rel="noopener">Arizona OEO • Occupation wages ↗</a><a href="https://oeo.az.gov/labor-market/employment-projections" target="_blank" rel="noopener">Arizona OEO • Employment projections ↗</a><a href="https://www.onetonline.org/" target="_blank" rel="noopener">O*NET OnLine • Career details ↗</a></div></section>',
    '<section class="lmi-workbench"><div class="section-title"><span class="eyebrow">YOUR SAVED CAREERS</span><h2>Capture the evidence that matters.</h2><p>Your saved occupations flow here for deeper investigation and eventually into My Career Tree.</p></div><div id="lmiCareerTabs" class="tab-row"></div><div id="lmiCareerPanel"></div><div class="official-links"><span>Primary LMI: Lightcast annual local snapshot</span><a href="https://www.onetonline.org/" target="_blank" rel="noopener">O*NET OnLine • Career details ↗</a></div></section>',
)
index = index.replace(
    'Arizona labor-market sources: Arizona Office of Economic Opportunity. Occupation descriptions and interest relationships: O*NET®. Career videos: CareerOneStop.',
    'Primary labor-market source: Lightcast annual local snapshot. Occupation descriptions and interest relationships: O*NET®. Career videos: CareerOneStop. Arizona OEO may be used as supplemental state context.',
)
index = index.replace('az-lmi-explorer.js?v=20261006-1', 'az-lmi-explorer.js?v=20261006-2')
index_path.write_text(index, encoding="utf-8")

print("Career Tree Lightcast data model and 550 optional XP model patched.")
