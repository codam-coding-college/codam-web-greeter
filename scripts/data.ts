import packageJSON from '../package.json';
import { lightdm } from 'nody-greeter-types/index'


export class Data {
	public pkgName: string;
	public pkgVersion: string;
	public hostname: string;

	constructor() {
		// Get version from package.json
		this.pkgName = packageJSON.name;
		this.pkgVersion = packageJSON.version;

		// Get hostname from LightDM
		this.hostname = lightdm.hostname;
	}
}
