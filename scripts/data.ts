import packageJSON from '../package.json';
import { lightdm } from 'nody-greeter-types/index'


export class Data {
	public version: string;
	public hostname: string;

	constructor() {
		// Get version from package.json
		this.version = packageJSON.version;

		// Get hostname from LightDM
		this.hostname = lightdm.hostname;
	}
}
