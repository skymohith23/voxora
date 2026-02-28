module.exports = {
  dependencies: {
    'react-native-worklets-core': {
      platforms: {
        android: {
          packageImportPath: 'import com.worklets.WorkletsCorePackage;',
          packageInstance: 'new WorkletsCorePackage()',
        },
      },
    },
  },
};