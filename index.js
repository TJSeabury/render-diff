const fs = require( 'fs' );
const puppeteer = require( 'puppeteer' );
const cron = require( 'node-cron' );
const path = require( 'path' );


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
      type: 'webp',
      quality: 100,
      encoding: 'binary'
    } );
  }
  return sizes;
};

const buildFileName = ( domain, size ) => `${domain}-${size.width}x${size.height}.webp`;

const saveMaster = ( domain, size ) => {
  const filename = buildFileName( domain, size );
  console.log( `Saving ${filename} ...` );
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

const areBuffersEqual = ( bufferA, bufferB ) => Buffer.compare( bufferA, bufferB ) === 0;


async function visitPages ( action ) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setCacheEnabled( false );

  const arbitraryReturnValue = await action( page );

  browser.close();

  return arbitraryReturnValue;
}


async function createMasterReferences ( page, domain, devices ) {

  const data = await capture(
    page,
    domain,
    devices
  );

  Object.entries( data ).map( ( [_, datum] ) => { saveMaster( domain, datum ); } );

}

async function createVerificationReferences ( page, domain, devices ) {
  const data = await capture(
    page,
    domain,
    devices
  );

  return data;
}

const onReadError = ( err, data ) => {
  if ( err ) throw err;
  console.log( data );
};

async function run () {

  // Testing
  const bubbleBassBuffer = fs.readFileSync( path.resolve( './_test/bubble-bass.webp' ) );
  const picklesBuffer = fs.readFileSync( path.resolve( './_test/pickles.webp' ) );
  if ( !bubbleBassBuffer || !picklesBuffer ) return;
  const testResult = areBuffersEqual( bubbleBassBuffer, picklesBuffer );
  console.log( [
    'Test - areBuffersEqual( bubbleBassBuffer, picklesBuffer ): ',
    `Should be false: ${testResult}`
  ] );
  if ( testResult === true ) throw new Error( 'Buffer test failed.' );


  // Let's get down to business~!

  const devices = sizes( [
    [2560, 1440],
    [1920, 1080],
    [1280, 1024],
    [768, 1024],
    [390, 844]
  ] );

  const domain = 'marketmentors.com';

  await visitPages( async ( page ) => { await createMasterReferences( page, domain, devices ); } );

  const masters = Object.entries( devices ).reduce( ( accum, [key, device] ) => {
    accum[key] = {
      ...device,
      imageBuffer: loadMaster( domain, device )
    };
    return accum;
  }, {} );

  const samples = await visitPages( async ( page ) => {
    return await createVerificationReferences(
      page,
      domain,
      devices
    );
  } );


  let diff = [];
  const a = Object.values( masters );
  const b = Object.values( samples );
  for ( let i = 0; i < Object.values( devices ).length; ++i ) {
    diff[i] = areBuffersEqual(
      a[i].imageBuffer,
      b[i].imageBuffer
    );
    console.log( `master ${a[i].width}x${a[i].height} <> sample ${b[i].width}x${b[i].height}`, diff[i] );
  }


  /* cron.schedule( '*\/5 * * * *', async function doScheduledTask () {
    // console.log( 'running a task every 5 minutes' );

    const masters = devices.map( ( device ) => loadMaster( domain, device ) );

    const references = await visitPages( async ( page ) => {
      return await createVerificationReferences(
        page,
        domain,
        devices
      );
    } );

    console.log(
      masters,
      references
    );


    let diffs = [];
    const safeLength = Math.min( pairedData[0], pairedData[1] );
    for ( let i = 0; i < safeLength; ++i ) {
      diffs[i] = areBuffersEqual(
        pairedData[0][i].imageBuffer,
        pairedData[1][i].imageBuffer
      );
    }



  } ); */

}

run();