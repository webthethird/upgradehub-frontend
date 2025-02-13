import { Col } from "antd"
import React, { useState } from "react"
import { Hunk, Decoration } from 'react-diff-view'
import { HiddenLargeHunk } from "./HiddenLargeHunk"

interface ExpandableHunkProps {
    fileLines: string[]
    hunk: HunkObject
    isLast: boolean
}

export interface HunkObject {
    "content": string,
    "oldStart": number,
    "newStart": number,
    "oldLines": number,
    "newLines": number,
    "changes": Change[],
    "isPlain": boolean,
    'expanded'?: boolean
}

interface Change {
    "content": string,
    "type": string,
    "isNormal": boolean,
    "oldLineNumber": number,
    "newLineNumber": number
}

const buildNormalChangeFromLine = (line: string, newLineNumber: number, oldLineNumber: number) => {
    return {
        "content": line,
        "type": "normal",
        "isNormal": true,
        "oldLineNumber": oldLineNumber,
        "newLineNumber": newLineNumber
    }
}

const expandHunkObjectUp = (prevHunk: HunkObject,
    nbLines: number,
    fileLines: string[]) => {

    const newStart = prevHunk.newStart - nbLines - 1
    if (newStart + nbLines >= 0) {
        const _oldStart = prevHunk.oldStart - nbLines - 1 >= 0 ? prevHunk.oldStart - nbLines - 1 : 0;
        const _newStart = newStart >= 0 ? newStart : 0
        const fileLinesToAdd: string[] = fileLines.slice(_newStart, newStart + nbLines);
        const normalChangesToAdd = fileLinesToAdd.map((l, i) => {
            //Offset by 1 since lines are 1-starting
            return buildNormalChangeFromLine(l, _newStart + i + 1, _oldStart + i + 1);
        })
        const newChanges = normalChangesToAdd.concat(prevHunk.changes);

        const newHunkObject: HunkObject = {
            ...prevHunk,
            newStart: prevHunk.newStart - nbLines,
            oldStart: prevHunk.oldStart - nbLines,
            newLines: prevHunk.newLines + nbLines,
            oldLines: prevHunk.oldLines + nbLines,
            expanded: true,
            changes: newChanges,
        };
        return newHunkObject;
    } else {
        return prevHunk;
    }
}

const expandHunkObjectDown = (prevHunk: HunkObject,
    nbLines: number,
    fileLines: string[]) => {
    if (prevHunk.newStart + prevHunk.newLines < fileLines.length) {
        const newEnd = prevHunk.newStart + prevHunk.newLines + nbLines;
        const _newEnd = newEnd > fileLines.length ? fileLines.length : newEnd;
        const fileLinesToAdd: string[] = fileLines.slice(
            prevHunk.newStart + prevHunk.newLines,
            _newEnd
        );
        const normalChangesToAdd = fileLinesToAdd.map((l, i) => {
            //Offset by 1 since lines are 1-starting ??
            return buildNormalChangeFromLine(
                l,
                prevHunk.newStart + prevHunk.newLines + i,
                prevHunk.oldStart + prevHunk.oldLines + i,
            );
        })
        const newChanges = prevHunk.changes.concat(normalChangesToAdd);

        const newHunkObject: HunkObject = {
            ...prevHunk,
            newLines: prevHunk.newLines + nbLines,
            oldLines: prevHunk.oldLines + nbLines,
            expanded: true,
            changes: newChanges,
        };
        return newHunkObject;
    } else {
        return prevHunk;
    }
}

export const ExpandableHunk = (props: ExpandableHunkProps) => {
    const [hunk, setHunk] = useState(props.hunk);
    const lastClass = props.isLast ? 'hunk-expand last-hunk-expand' : 'hunk-expand';

    const N = 20;

    const [hunkUpEnabled, disableHunkUp] = useState(true);
    const [hunkDownEnabled, disableHunkDown] = useState(true);

    const expandUp = () => {
        const newHunk = expandHunkObjectUp(hunk, N, props.fileLines);
        setHunk(newHunk);
    }

    const expandDown = () => {
        const newHunk = expandHunkObjectDown(hunk, N, props.fileLines);
        setHunk(newHunk);
    }
    if (hunkUpEnabled && hunk.newStart <= 1) {
        disableHunkUp(false);
    }
    if (hunkDownEnabled && hunk.newStart+hunk.newLines >= props.fileLines.length) {
        disableHunkDown(false);
    }
    return <>
        <HiddenLargeHunk hunk={hunk} setHunk={setHunk} isLast={props.isLast}>
            {hunkUpEnabled ?
                <Decoration>
                    <div className='hunk-expand' onClick={expandUp}>
                        <Col span={8} offset={8}>
                            <div className="hunk-expand-icon-container">
                                <i className="fa fa-angle-double-up" aria-hidden="true"></i>
                            </div>
                        </Col>
                    </div>
                </Decoration>
                : <></>
            }
            <Hunk key={hunk.content} hunk={hunk} />
            {hunkDownEnabled ?
                <Decoration>
                    <div className={lastClass} onClick={expandDown}>
                        <Col span={8} offset={8}>
                            <div className="hunk-expand-icon-container">
                                <i className="fa fa-angle-double-down" aria-hidden="true"></i>
                            </div>
                        </Col>
                    </div>
                </Decoration>
                : <></>
            }

        </HiddenLargeHunk>
    </>
}