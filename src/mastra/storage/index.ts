// FileStore is not exported in @mastra/core v0.20.0
// Using Postgres storage instead (see below)
// import { FileStore } from "@mastra/core/storage";

// export const storage = new FileStore({
//   filePath: "/opt/render/project/src/us-complete.txt",
// });

// Basic file-based storage for local development
import * as fs from "fs";
import * as path from "path";

class LocalFileStorage {
	filePath: string;
	constructor(filePath: string) {
		this.filePath = path.resolve(filePath);
	}
	async read() {
		try {
			return await fs.promises.readFile(this.filePath, "utf-8");
		} catch (err) {
			return null;
		}
	}
	async write(data: string) {
		await fs.promises.writeFile(this.filePath, data, "utf-8");
	}
}

export const storage = new LocalFileStorage("./us-complete.txt");
