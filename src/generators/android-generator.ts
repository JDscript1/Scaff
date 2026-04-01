import { BaseGenerator } from './base-generator.js';
import { FileOperation, ProjectProfile } from '../types/index.js';
import path from 'node:path';

export class AndroidGenerator extends BaseGenerator {
  async generateInit(data: any): Promise<FileOperation[]> {
    return [
      {
        type: 'create',
        path: 'app/src/main/java/com/example/MainActivity.kt',
        content: 'class MainActivity : ComponentActivity()',
        description: 'Activitate principală Android'
      }
    ];
  }

  async generateFeature(profile: ProjectProfile, data: any): Promise<FileOperation[]> {
    const { featureName } = data;
    const packageName = data.packageName || 'com.example.app';
    const packagePath = packageName.replace(/\./g, '/');
    const baseDir = data.targetPath || `app/src/main/java/${packagePath}/ui/${featureName.toLowerCase()}`;

    // Încărcare template-uri Android
    const screenTpl = await this.getTemplate('android/screen.hbs');
    const vmTpl = await this.getTemplate('android/viewmodel.hbs');

    const viewData = { name: featureName, packageName };

    return [
      {
        type: 'create',
        path: path.join(baseDir, `${featureName}Screen.kt`),
        content: this.templateEngine.compile(screenTpl, viewData),
        description: `Ecran Jetpack Compose: ${featureName}`
      },
      {
        type: 'create',
        path: path.join(baseDir, `${featureName}ViewModel.kt`),
        content: this.templateEngine.compile(vmTpl, viewData),
        description: `ViewModel: ${featureName}`
      }
    ];
  }
}
