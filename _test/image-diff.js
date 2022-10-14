const fs = require( 'fs' );
const path = require( 'path' );
const ndarray = require( 'ndarray' );
const PNG = require( 'pngjs' ).PNG;

/**
 * compare two binary arrays for equality
 * @param {(ArrayBuffer|ArrayBufferView)} a
 * @param {(ArrayBuffer|ArrayBufferView)} b 
 */
function equal ( a, b ) {
  if ( a instanceof ArrayBuffer ) a = new Uint8Array( a, 0 );
  if ( b instanceof ArrayBuffer ) b = new Uint8Array( b, 0 );
  if ( a.byteLength != b.byteLength ) return false;
  if ( aligned32( a ) && aligned32( b ) )
    return equal32( a, b );
  if ( aligned16( a ) && aligned16( b ) )
    return equal16( a, b );
  return equal8( a, b );
}

function equal8 ( a, b ) {
  const ua = new Uint8Array( a.buffer, a.byteOffset, a.byteLength );
  const ub = new Uint8Array( b.buffer, b.byteOffset, b.byteLength );
  return compare( ua, ub );
}
function equal16 ( a, b ) {
  const ua = new Uint16Array( a.buffer, a.byteOffset, a.byteLength / 2 );
  const ub = new Uint16Array( b.buffer, b.byteOffset, b.byteLength / 2 );
  return compare( ua, ub );
}
function equal32 ( a, b ) {
  const ua = new Uint32Array( a.buffer, a.byteOffset, a.byteLength / 4 );
  const ub = new Uint32Array( b.buffer, b.byteOffset, b.byteLength / 4 );
  return compare( ua, ub );
}

function compare ( a, b ) {
  for ( let i = a.length; -1 < i; i -= 1 ) {
    if ( ( a[i] !== b[i] ) ) return false;
  }
  return true;
}

function aligned16 ( a ) {
  return ( a.byteOffset % 2 === 0 ) && ( a.byteLength % 2 === 0 );
}

function aligned32 ( a ) {
  return ( a.byteOffset % 4 === 0 ) && ( a.byteLength % 4 === 0 );
}


async function main () {

  const aPath = path.resolve( __dirname, '8x8-a.png' );
  const bPath = path.resolve( __dirname, '8x8-b.png' );

  async function loadPNG ( path ) {
    const imageBuffer = fs.readFileSync( path );

    const image = PNG.sync.read( imageBuffer );

    return ndarray(
      new Uint8Array( image.data ),
      [image.width | 0, image.height | 0, 4],
      [4, 4 * image.width | 0, 1],
      0
    );
  }

  let a = await loadPNG( aPath );
  let b = await loadPNG( bPath );

  console.log( equal( a.data, b.data ) );

}
main();