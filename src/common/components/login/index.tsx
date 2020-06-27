import React, { Component } from "react";

import { Modal } from "react-bootstrap";

import isEqual from "react-fast-compare";

import { User } from "../../store/users/types";
import { Account } from "../../store/accounts/types";
import { ActiveUser } from "../../store/active-user/types";

import UserAvatar from "../user-avatar";
import Tooltip from "../tooltip";
import PopoverConfirm from "../popover-confirm";

import { getAuthUrl } from "../../helper/hive-signer";

import { getAccount } from "../../api/hive";

import { _t } from "../../i18n";

import { deleteForeverSvg } from "../../img/svg";

const hsLogo = require("../../img/hive-signer.svg");

interface UserItemprops {
  user: User;
  activeUser: ActiveUser | null;
  onSelect: (user: User) => void;
  onDelete: (user: User) => void;
}

export class UserItem extends Component<UserItemprops> {
  render() {
    const { user, activeUser } = this.props;

    return (
      <div
        className={`user-list-item ${activeUser && activeUser.username === user.username ? "active" : ""}`}
        onClick={() => {
          const { onSelect } = this.props;
          onSelect(user);
        }}
      >
        <UserAvatar {...this.props} username={user.username} size="normal" />
        <span className="username">@{user.username}</span>
        {activeUser && activeUser.username === user.username && <div className="check-mark" />}
        <div className="flex-spacer" />
        <PopoverConfirm
          onConfirm={() => {
            const { onDelete } = this.props;
            onDelete(user);
          }}
        >
          <div
            className="btn-delete"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Tooltip content={_t("g.delete")}>
              <span>{deleteForeverSvg}</span>
            </Tooltip>
          </div>
        </PopoverConfirm>
      </div>
    );
  }
}

interface LoginProps {
  users: User[];
  activeUser: ActiveUser | null;
  setActiveUser: (username: string | null) => void;
  updateActiveUser: (data: Account) => void;
  deleteUser: (username: string) => void;
  onLogin: () => void;
}

export class Login extends Component<LoginProps> {
  shouldComponentUpdate(nextProps: Readonly<LoginProps>): boolean {
    return !isEqual(this.props.users, nextProps.users) || !isEqual(this.props.activeUser, nextProps.activeUser);
  }

  render() {
    const { users } = this.props;
    return (
      <>
        {users.length > 0 && (
          <>
            <div className="user-list">
              <div className="user-list-header">{_t("login.users-title")}</div>
              <div className="user-list-body">
                {users.map((u) => {
                  return (
                    <UserItem
                      key={u.username}
                      {...this.props}
                      user={u}
                      onSelect={(user) => {
                        const { setActiveUser, updateActiveUser, onLogin } = this.props;
                        setActiveUser(user.username);
                        onLogin();
                        getAccount(user.username).then((r) => {
                          updateActiveUser(r);
                        });
                      }}
                      onDelete={(user) => {
                        const { activeUser, deleteUser, setActiveUser } = this.props;
                        deleteUser(user.username);

                        if (activeUser && user.username === activeUser.username) {
                          setActiveUser(null);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
            <div className="or-divider">{_t("login.or")}</div>
          </>
        )}
        <div className="hs-login">
          <a className="btn btn-outline-primary" href={getAuthUrl()}>
            <img src={hsLogo} className="hs-logo" /> {_t("login.with-hivesigner")}
          </a>
        </div>
        <p>
          {_t("login.signup-text-1")}
          &nbsp;
          <a href="#">{_t("login.signup-text-2")}</a>
        </p>
      </>
    );
  }
}

interface Props {
  users: User[];
  activeUser: ActiveUser | null;
  setActiveUser: (username: string | null) => void;
  updateActiveUser: (data: Account) => void;
  deleteUser: (username: string) => void;
  onHide: () => void;
  onLogin: () => void;
}

export default class LoginDialog extends Component<Props> {
  render() {
    const { onHide } = this.props;
    return (
      <Modal show={true} centered={true} onHide={onHide} className="login-modal">
        <Modal.Header closeButton={true} />
        <Modal.Body>
          <Login {...this.props} />
        </Modal.Body>
      </Modal>
    );
  }
}