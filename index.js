const fs = require( 'fs' );
const puppeteer = require( 'puppeteer' );

async function run () {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setCacheEnabled( false );

  const capture = async ( page, domain, sizes ) => {
    await page.goto( `https://${domain}`,
      {
        waitUntil: 'networkidle0'
      }
    );

    for ( const [
      name,
      {
        width,
        height
      }
    ] of Object.entries( sizes ) ) {
      await page.setViewport( {
        width: width,
        height: height
      } );
      await page.reload( { waitUntil: 'networkidle0' } );
      sizes[name].imageBuffer = await page.screenshot( {
        fullPage: true,
        type: 'png',
        encoding: 'binary'
      } );
    }
    return sizes;
  };

  const buildFileName = ( domain, size ) => `${domain}-${size.width}x${size.height}.png`;

  const saveMaster = ( domain, size ) => {
    const filename = buildFileName( domain, size );
    console.log( `Saving ${filename} ...`, size );
    fs.writeFileSync( filename, size.imageBuffer );
  };

  const loadMaster = ( domain, size ) => {
    return fs.readFileSync( buildFileName( domain, size ) );
  };

  const sizes = ( sizes ) => sizes.reduce( ( accum, [w, h] ) => ( {
    ...accum,
    [`${w}x${h}`]: {
      width: w,
      height: h
    }
  } ), {} );

  const devices = sizes( [
    [2560, 1440],
    [1920, 1080],
    [1280, 1024],
    [768, 1024],
    [390, 844]
  ] );

  const domain = 'marketmentors.com';

  const firstData = await capture(
    page,
    domain,
    devices
  );

  Object.entries( firstData ).map( ( [_, datum] ) => { saveMaster( domain, datum ); } );

  const secondData = await capture(
    page,
    domain,
    devices
  );

  const pairedData = [
    Object.entries( firstData ),
    Object.entries( secondData )
  ];

  console.log( pairedData );


  browser.close();
}

run();











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