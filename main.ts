import {
	Editor,
	MarkdownView,
	Menu,
	MenuItem,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
} from "obsidian";

interface DeepNotesSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: DeepNotesSettings = {
	mySetting: "default",
};

export default class DeepNotes extends Plugin {
	settings: DeepNotesSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "create-note-from-selection",
			name: "Create New Note from Selection",
			editorCallback: (editor: Editor, view: MarkdownView) =>
				this.createNoteFromSelection(editor, view),
		});

		this.registerEvent(
			this.app.workspace.on(
				"editor-menu",
				(menu: Menu, editor: Editor, view: MarkdownView) => {
					menu.addItem((item: MenuItem) => {
						item.setTitle("Create new note")
							.setIcon("document")
							.onClick(() =>
								this.createNoteFromSelection(editor, view)
							);
					});
				}
			)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createNoteFromSelection(editor: Editor, view: MarkdownView) {
		const selectedText: string = editor.getSelection();
		if (!selectedText) return;

		// Replace or remove invalid characters for the filename, but keep spaces
		const sanitizedFileName: string = selectedText
			.trim()
			.replace(/[\\/:*?"<>|#%&{}[\]@!$'+=]/g, " ");
		const newNoteName: string = selectedText.trim(); // Keep spaces for the title
		const newNotePath: string = sanitizedFileName + ".md";

		const newNoteContent = `# ${newNoteName}`;

		try {
			// Create the new note
			await this.app.vault.create(newNotePath, newNoteContent);

			// Replace selected text with link to the new note
			const linkToNewNote = `[[${sanitizedFileName}]]`;
			editor.replaceSelection(linkToNewNote);

			// Notify user about the new note creation
			new Notice(`New note created: ${newNoteName}`);

			// Open the new note in a new tab (leaf)
			const newFile: TAbstractFile | null =
				this.app.vault.getAbstractFileByPath(newNotePath);
			if (newFile && newFile instanceof TFile) {
				const newLeaf: WorkspaceLeaf = this.app.workspace.getLeaf(true);
				newLeaf.openFile(newFile);
			}
		} catch (error) {
			new Notice(`Error creating note: ${error.message}`);
		}
	}
}
