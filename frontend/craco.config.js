const path = require('path');

const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Ensure resolve and alias are properly configured
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve?.alias,
          '@': path.resolve(__dirname, 'src'),
        },
        // Add fallback for extensions if not present
        extensions: webpackConfig.resolve?.extensions || ['.js', '.jsx', '.json', '.ts', '.tsx'],
      };
                
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/,
        };
      } else {
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
};