/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import {window, HoverProvider, Hover, TextDocument, Position, Range, IHTMLContentElement, CancellationToken} from 'vscode';
import cp = require('child_process');
import path = require('path');

export class GoHoverProvider implements HoverProvider {

	public provideHover(document: TextDocument, position: Position, token: CancellationToken): Thenable<Hover> {

		return new Promise((resolve, reject) => {
			let filename = document.getUri().fsPath;
			let wordAtPosition = document.getWordRangeAtPosition(position);

			// compute the file offset for position
			let range = new Range(0, 0, position.line, position.character);
			let offset = document.getTextInRange(range).length;

			let godef = path.join(process.env["GOPATH"], "bin", "godef");

			// Spawn `godef` process
			let p = cp.execFile(godef, ["-t", "-i", "-f", filename, "-o", offset.toString()], {}, (err, stdout, stderr) => {
				try {
					if (err && (<any>err).code == "ENOENT") {
						window.showInformationMessage("The 'godef' command is not available.  Use 'go get -u github.com/rogpeppe/godef' to install.");
					}
					if (err) return resolve(null);
					let result = stdout.toString();
					let lines = result.split('\n');
					if(lines.length > 10) lines[9] = "...";
					let text = lines.slice(1,10).join('\n');
					let range = new Range(
						position.line,
						wordAtPosition ? wordAtPosition.start.character : position.character,
						position.line,
						wordAtPosition ? wordAtPosition.end.character : position.character);
					let hover = new Hover(text, range);
					return resolve(hover);
				} catch(e) {
					reject(e);
				}
			});
			p.stdin.end(document.getText());
		});
	}
}
