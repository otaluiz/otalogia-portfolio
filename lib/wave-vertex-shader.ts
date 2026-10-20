// Adapted from franky-adl/3d-wave-grid (MIT). See THIRD_PARTY_NOTICES.md.
export function waveVertexShader(vertexShader: string) {
        return vertexShader
            .replace(
                "#include <common>",
                `#include <common>
                varying float vHeight;
                attribute vec2 aOffset;
                uniform sampler2D uTrailTexture;
                uniform int       uTrailCount;
                uniform float     uWaveSpeed;
                uniform float     uWaveFreq;
                uniform float     uWaveWidth;
                uniform float     uFadeTime;
                uniform float     uAmplitude;
                uniform float     uJitter;
                uniform float     uMaxHeight;

                // Deterministic per-instance hash → two values in [-0.5, 0.5].
                // Stable across frames; depends only on world position.
                vec2 hash2( vec2 p ) {
                    p = vec2(
                        dot( p, vec2( 127.1, 311.7 ) ),
                        dot( p, vec2( 269.5, 183.3 ) )
                    );
                    return fract( sin( p ) * 43758.5453123 ) - 0.5;
                }`,
            )
            .replace(
                "#include <begin_vertex>",
                `#include <begin_vertex>

                vHeight = 0.0;

                if ( position.y > 0.0 ) {
                    vec2 jitter  = hash2( aOffset ) * uJitter;
                    vec2 worldXZ = aOffset + jitter;
                    float waveHeight  = 0.0;
                    float totalWeight = 0.0;

                    for ( int i = 0; i < uTrailCount; i++ ) {
                        // texel layout: (worldX, worldZ, age, distDelta)
                        vec4 td = texture2D(
                            uTrailTexture,
                            vec2( ( float(i) + 0.5 ) / 128.0, 0.5 )
                        );
                        float dist      = length( worldXZ - td.rg );
                        float wavefront = uWaveSpeed * td.b;
                        float relDist   = dist - wavefront;

                        // Gaussian envelope centred on the expanding wavefront
                        float window = exp( -( relDist * relDist ) / ( uWaveWidth * uWaveWidth ) );
                        // Exponential time-fade + distance attenuation
                        float fade   = exp( -td.b / uFadeTime );
                        float atten  = 1.0 / ( 1.0 + dist * 0.1 );
                        float weight = fade * window * atten * td.a; // td.a is distDelta, used to weaken waves from closely spaced trail points

                        waveHeight  += weight * cos( uWaveFreq * relDist );
                        totalWeight += weight;
                    }

                    // Weighted average: overlapping waves average rather than stack,
                    // cancelling chaotic superposition while preserving single-wave peaks.
                    waveHeight /= max( totalWeight, 1.0 );

                    float displacement = clamp( waveHeight * uAmplitude, -uMaxHeight, uMaxHeight );
                    transformed.y += displacement;
                    vHeight = displacement;
                }`,
            );
    }

