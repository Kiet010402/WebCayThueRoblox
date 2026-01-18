const { override, addWebpackPlugin } = require('customize-cra');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = override(
  (config, env) => {
    // Disable source maps completely in production
    if (env === 'production') {
      config.devtool = false;
      // Also disable inline source maps
      config.optimization = {
        ...config.optimization,
        minimize: true
      };
    }
    return config;
  },
  // Add obfuscator plugin using addWebpackPlugin helper
  addWebpackPlugin(
    new JavaScriptObfuscator(
      {
        // Mức obfuscation cao
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        rotateStringArray: true,
        selfDefending: true,
        shuffleStringArray: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersParametersMaxCount: 4,
        stringArrayWrappersType: 'function',
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
      },
      // Only obfuscate in production, exclude nothing (obfuscate all)
      process.env.NODE_ENV === 'production' ? [] : ['**']
    )
  )
);
