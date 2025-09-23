"use client";
import React, {
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import { MessageEntity } from "@db";
import {
	TextEditor,
	TextEditorHandle,
} from "@/components/mailbox/default/editor/rich-text-editor";

export type EmailEditorHandle = {
	focus: () => void;
	getElement: () => HTMLElement | null;
};

type Props = { onReady?: (el: HTMLElement) => void; message: MessageEntity };

const EmailEditor = forwardRef<EmailEditorHandle, Props>(
	({ onReady, message }, ref) => {
		const textEditorRef = useRef<TextEditorHandle>(null);

		useImperativeHandle(
			ref,
			() => ({
				focus: () => textEditorRef.current?.focus("end"),
				getElement: () => textEditorRef.current?.getElement() ?? null,
			}),
			[],
		);

		useEffect(() => {
			const el = textEditorRef.current?.getElement();
			if (el) onReady?.(el);
		}, [onReady]);

		return (
			<div className="mt-4" tabIndex={-1}>
				<TextEditor ref={textEditorRef} message={message} />
			</div>
		);
	},
);

EmailEditor.displayName = "EmailEditor";
export default EmailEditor;
