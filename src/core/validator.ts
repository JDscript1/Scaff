import { ProjectProfile } from '../types/index.js';

export class Validator {
  static validateCompatibility(requestType: string, profile: ProjectProfile, args: any): void {
    if (requestType === 'generate_feature' || requestType === 'generate_component') {
      const targetStack = args.targetStack || args.framework;
      
      if (profile.type !== 'unknown' && targetStack && profile.type !== targetStack) {
        throw new Error(
          `Incompatibilitate detectată: Încerci să generezi un feature "${targetStack}" într-un proiect de tip "${profile.type}".`
        );
      }
    }

    if (requestType === 'add_project_capability' && profile.type === 'unknown') {
      throw new Error("Nu pot adăuga capabilități într-un folder care nu pare a fi un proiect valid.");
    }
  }
}
