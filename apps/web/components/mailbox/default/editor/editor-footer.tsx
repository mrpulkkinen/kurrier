import React from 'react';
import {ActionIcon, Button, Popover} from "@mantine/core";
import {Baseline} from "lucide-react";
import {RichTextEditor} from "@mantine/tiptap";
import {useFormStatus} from "react-dom";
import {useDynamicContext} from "@/hooks/use-dynamic-context";

function EditorFooter() {
    const {state} = useDynamicContext()

    return <>
        <div className={"border-t items-center flex py-2"}>
            <div className={"mx-2"}>
                <Button loading={!!state.isPending} size={"xs"} radius={"xl"} type={"submit"}>
                    Send
                </Button>
            </div>

            <Popover position="top-start" withArrow shadow="md">
                <Popover.Target>
                    <ActionIcon variant={"transparent"}>
                        <Baseline />
                    </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown className={"!p-0"}>
                    <RichTextEditor.Toolbar
                        sticky
                        stickyOffset={60}
                        className={"!border-0"}
                    >
                        <RichTextEditor.ControlsGroup>
                            <RichTextEditor.Bold />
                            <RichTextEditor.Italic />
                            <RichTextEditor.Underline />
                            <RichTextEditor.Strikethrough />
                            <RichTextEditor.ClearFormatting />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                            <RichTextEditor.BulletList />
                            <RichTextEditor.OrderedList />
                        </RichTextEditor.ControlsGroup>

                        <RichTextEditor.ControlsGroup>
                            <RichTextEditor.Undo />
                            <RichTextEditor.Redo />
                        </RichTextEditor.ControlsGroup>
                    </RichTextEditor.Toolbar>
                </Popover.Dropdown>
            </Popover>
        </div>
    </>
}

export default EditorFooter;
