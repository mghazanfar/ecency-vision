import React from "react";

import {History} from "history";

import BaseComponent from "../base";

import isEqual from "react-fast-compare";

import {ActiveUser} from "../../store/active-user/types";
import {Entry} from "../../store/entries/types";
import {Communities, Community, ROLES} from "../../store/communities/types";
import {EntryPinTracker} from "../../store/entry-pin-tracker/types";
import {Global} from "../../store/global/types";

import EditHistory from "../edit-history";
import EntryShare, {shareReddit, shareTwitter, shareFacebook} from "../entry-share";
import MuteBtn from "../mute-btn";
import Promote from "../promote";
import Boost from "../boost";
import ModalConfirm from "../modal-confirm";
import {error, success} from "../feedback";
import DropDown, {MenuItem} from "../dropdown";

import {_t} from "../../i18n";

import clipboard from "../../util/clipboard";

import {deleteComment, formatError, pinPost} from "../../api/operations";

import {
    dotsHorizontal, deleteForeverSvg,
    pencilOutlineSvg, pinSvg, historySvg, shareVariantSvg, linkVariantSvg,
    volumeOffSvg, redditSvg, twitterSvg, facebookSvg, bullHornSvg, rocketLaunchSvg
} from "../../img/svg";
import {Account} from "../../store/accounts/types";
import {DynamicProps} from "../../store/dynamic-props/types";

interface Props {
    history: History;
    global: Global;
    dynamicProps: DynamicProps;
    activeUser: ActiveUser | null;
    entry: Entry;
    community: Community | null;
    communities: Communities;
    entryPinTracker: EntryPinTracker;
    separatedSharing?: boolean;
    alignBottom?: boolean,
    signingKey: string;
    setSigningKey: (key: string) => void;
    updateActiveUser: (data?: Account) => void;
    updateEntry: (entry: Entry) => void;
    trackEntryPin: (entry: Entry) => void;
    setEntryPin: (pin: boolean) => void;
}

interface State {
    share: boolean;
    editHistory: boolean;
    delete_: boolean;
    pin: boolean;
    unpin: boolean;
    mute: boolean;
    promote: boolean;
    boost: boolean;
}

class EntryMenu extends BaseComponent<Props, State> {
    state: State = {
        share: false,
        editHistory: false,
        delete_: false,
        pin: false,
        unpin: false,
        mute: false,
        promote: false,
        boost: false,
    }

    componentDidMount() {
        const {entry, trackEntryPin} = this.props;

        if (this.canPinOrMute()) {
            setTimeout(() => {
                trackEntryPin(entry);
            }, 500);
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        const {entry, trackEntryPin, activeUser} = this.props;

        if (!isEqual(this.props.communities, prevProps.communities) ||
            activeUser?.username !== prevProps.activeUser?.username) {
            trackEntryPin(entry);
        }
    }

    toggleShare = () => {
        const {share} = this.state;
        this.stateSet({share: !share});
    }

    toggleEditHistory = () => {
        const {editHistory} = this.state;
        this.stateSet({editHistory: !editHistory});
    }

    toggleDelete = () => {
        const {delete_} = this.state;
        this.stateSet({delete_: !delete_});
    }

    togglePin = () => {
        const {pin} = this.state;
        this.stateSet({pin: !pin});
    }

    toggleUnpin = () => {
        const {unpin} = this.state;
        this.stateSet({unpin: !unpin});
    }

    toggleMute = () => {
        const {mute} = this.state;
        this.stateSet({mute: !mute});
    }

    togglePromote = () => {
        const {promote} = this.state;
        this.stateSet({promote: !promote});
    }

    toggleBoost = () => {
        const {boost} = this.state;
        this.stateSet({boost: !boost});
    }

    canPinOrMute = () => {
        const {activeUser, community} = this.props;

        return activeUser && community ? !!community.team.find(m => {
            return m[0] === activeUser.username &&
                [ROLES.OWNER.toString(), ROLES.ADMIN.toString(), ROLES.MOD.toString()].includes(m[1])
        }) : false;
    }

    copyAddress = () => {
        const {entry} = this.props;

        const u = `https://ecency.com/${entry.category}/@${entry.author}/${entry.permlink}`
        clipboard(u);
        success(_t("entry.address-copied"));
    };

    edit = () => {
        const {entry, history} = this.props;

        const u = `/@${entry.author}/${entry.permlink}/edit`;
        history.push(u);
    }

    delete = () => {
        const {history, activeUser, entry} = this.props;
        deleteComment(activeUser!.username, entry.author, entry.permlink)
            .then(() => {
                history.push('/');
            })
            .catch((e) => {
                error(formatError(e));
            })
    }

    pin = (pin: boolean) => {
        const {entry, community, activeUser, setEntryPin} = this.props;

        pinPost(activeUser!.username, community!.name, entry.author, entry.permlink, pin)
            .then(() => {
                setEntryPin(pin);

                if (pin) {
                    success(_t("entry-menu.pin-success"));
                } else {
                    success(_t("entry-menu.unpin-success"));
                }

            })
            .catch(err => {
                error(formatError(err));
            })
    }

    render() {
        const {global, activeUser, community, entry, entryPinTracker, alignBottom, separatedSharing} = this.props;

        const isComment = !!entry.parent_author;

        const ownEntry = activeUser && activeUser.username === entry.author;

        const editable = ownEntry && !isComment;

        let menuItems: MenuItem[] = [];

        if (!separatedSharing) {
            menuItems = [
                {
                    label: _t("entry-menu.share"),
                    onClick: this.toggleShare,
                    icon: shareVariantSvg
                }
            ]
        }

        menuItems = [
            ...menuItems,
            {
                label: _t("entry-menu.edit-history"),
                onClick: this.toggleEditHistory,
                icon: historySvg
            }
        ];

        if (editable) {
            menuItems = [...menuItems,
                ...[
                    {
                        label: _t("g.edit"),
                        onClick: this.edit,
                        icon: pencilOutlineSvg
                    },
                    {
                        label: _t("g.delete"),
                        onClick: this.toggleDelete,
                        icon: deleteForeverSvg
                    }
                ]
            ];
        }

        if (this.canPinOrMute()) {
            if (entryPinTracker.pinned) {
                menuItems = [...menuItems, {
                    label: _t("entry-menu.unpin"),
                    onClick: this.toggleUnpin,
                    icon: pinSvg
                }];
            } else {
                menuItems = [...menuItems, {
                    label: _t("entry-menu.pin"),
                    onClick: this.togglePin,
                    icon: pinSvg
                }];
            }

            const isMuted = !!entry.stats?.gray;
            menuItems = [
                ...menuItems,
                ...[
                    {
                        label: (isMuted ? _t("entry-menu.unmute") : _t("entry-menu.mute")),
                        onClick: this.toggleMute,
                        icon: volumeOffSvg
                    }
                ]
            ];
        }

        menuItems = [
            ...menuItems,
            ...[
                {
                    label: _t("entry-menu.promote"),
                    onClick: this.togglePromote,
                    icon: bullHornSvg
                },
                {
                    label: _t("entry-menu.boost"),
                    onClick: this.toggleBoost,
                    icon: rocketLaunchSvg
                }
            ]
        ];

        if (global.isElectron) {
            menuItems = [
                ...menuItems,
                {
                    label: _t("entry.address-copy"),
                    onClick: this.copyAddress,
                    icon: linkVariantSvg
                }
            ]
        }

        const menuConfig = {
            history: this.props.history,
            label: '',
            icon: dotsHorizontal,
            items: menuItems
        };

        const {share, editHistory, delete_, pin, unpin, mute, promote, boost} = this.state;

        return <div className="entry-menu">
            {separatedSharing && (
                <div className="separated-share">
                    <div className="share-button single-button" onClick={this.toggleShare}>{shareVariantSvg}</div>
                    <div className="all-buttons">
                        <div className="share-button" onClick={() => {
                            shareReddit(entry);
                        }}>{redditSvg}</div>
                        <div className="share-button" onClick={() => {
                            shareTwitter(entry);
                        }}>{twitterSvg}</div>
                        <div className="share-button share-button-facebook" onClick={() => {
                            shareFacebook(entry);
                        }}>{facebookSvg}</div>
                    </div>
                </div>
            )}

            <DropDown {...menuConfig} float="right" alignBottom={alignBottom}/>

            {share && <EntryShare entry={entry} onHide={this.toggleShare}/>}
            {editHistory && <EditHistory entry={entry} onHide={this.toggleEditHistory}/>}
            {delete_ && <ModalConfirm onConfirm={() => {
                this.delete();
                this.toggleDelete();
            }} onCancel={this.toggleDelete}/>}
            {pin && <ModalConfirm onConfirm={() => {
                this.pin(true);
                this.togglePin();
            }} onCancel={this.togglePin}/>}
            {unpin && <ModalConfirm onConfirm={() => {
                this.pin(false);
                this.toggleUnpin();
            }} onCancel={this.toggleUnpin}/>}
            {(community && activeUser && mute) && MuteBtn({
                community,
                entry,
                activeUser: activeUser,
                onlyDialog: true,
                onSuccess: (entry) => {
                    const {updateEntry} = this.props;
                    updateEntry(entry);
                    this.toggleMute();
                },
                onCancel: this.toggleMute
            })}
            {(activeUser && promote) && (
                <Promote {...this.props} activeUser={activeUser} entry={entry} onHide={this.togglePromote}/>
            )}
            {(activeUser && boost) && (
                <Boost {...this.props} activeUser={activeUser} entry={entry} onHide={this.toggleBoost}/>
            )}
        </div>;
    }
}


export default (p: Props) => {
    const props: Props = {
        history: p.history,
        global: p.global,
        dynamicProps: p.dynamicProps,
        activeUser: p.activeUser,
        entry: p.entry,
        community: p.community,
        communities: p.communities,
        entryPinTracker: p.entryPinTracker,
        separatedSharing: p.separatedSharing,
        alignBottom: p.alignBottom,
        signingKey: p.signingKey,
        setSigningKey: p.setSigningKey,
        updateActiveUser: p.updateActiveUser,
        updateEntry: p.updateEntry,
        trackEntryPin: p.trackEntryPin,
        setEntryPin: p.setEntryPin
    }

    return <EntryMenu {...props} />
}
