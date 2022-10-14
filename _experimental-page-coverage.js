async function pageCoverage ( page, domain ) {
  await Promise.all( [
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage()
  ] );

  await page.goto( `https://${domain}`,
    {
      waitUntil: 'networkidle0'
    }
  );

  const [jsCoverage, cssCoverage] = await Promise.all( [
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ] );

  console.log( {
    coverage: {
      jsCoverage: examineJSCoverage( jsCoverage ),
      cssCoverage: examineCSSCoverage( cssCoverage )
    }
  } );
}

function examineJSCoverage ( jsCoverage ) {
  const js_coverage = [...jsCoverage];
  let js_used_bytes = 0;
  let js_total_bytes = 0;
  let covered_js = "";
  for ( const entry of js_coverage[0] ) {
    js_total_bytes += entry.text.length;
    for ( const range of entry.ranges ) {
      js_used_bytes += range.end - range.start - 1;
      covered_js += entry.text.slice( range.start, range.end ) + "\n";
    }
  }

  return [
    `Total Bytes of JS: ${js_total_bytes}`,
    `Used Bytes of JS: ${js_used_bytes}`,
    `Ratio: ${js_used_bytes / js_total_bytes}`
  ];
}

function examineCSSCoverage ( cssCoverage ) {
  const css_coverage = [...cssCoverage];
  let css_used_bytes = 0;
  let css_total_bytes = 0;
  let covered_css = "";
  for ( const entry of css_coverage[0] ) {
    css_total_bytes += entry.text.length;
    for ( const range of entry.ranges ) {
      css_used_bytes += range.end - range.start - 1;
      covered_css += entry.text.slice( range.start, range.end ) + "\n";
    }
  }

  return [
    `Total Bytes of CSS: ${css_total_bytes}`,
    `Used Bytes of CSS: ${css_used_bytes}`,
    `Ratio: ${css_used_bytes / css_total_bytes}`
  ];
}