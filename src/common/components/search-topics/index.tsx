import React from "react";

import {History, Location} from "history";

import queryString from "query-string";

import {Global} from "../../store/global/types";

import BaseComponent from "../base";

import SearchQuery from "../../helper/search-query";

import {searchTag, TagSearchResult} from "../../api/private";

import {_t} from "../../i18n";

interface Props {
    history: History;
    location: Location;
    global: Global;
}

interface State {
    search: string;
    results: TagSearchResult[]
}

const grabSearch = (location: Location) => {
    const qs = queryString.parse(location.search);
    const q = qs.q as string;

    return new SearchQuery(q).search.split(" ")[0].replace("@", "");
}

export class SearchTopics extends BaseComponent<Props, State> {
    state: State = {
        search: grabSearch(this.props.location),
        results: [],
    };

    componentDidMount() {
        this.fetch();
    }


    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) {
        const search = grabSearch(this.props.location);
        if (search !== grabSearch(prevProps.location)) {
            this.stateSet({search}, this.fetch);
        }
    }

    fetch = () => {
        const {search} = this.state;
        this.stateSet({results: []});
        searchTag(search, 10).then(results => {
            this.stateSet({results});
        })
    }

    render() {
        const {results} = this.state;

        if (results.length === 0) {
            return null;
        }

        return <div className="card search-topics">
            <div className="card-header">
                <strong>{_t("search-topics.title")}</strong>
            </div>
            <div className="card-body">
                {(() => {
                    return <div className="topic-list">
                        {results.map(x => {
                            return <a className="list-item" key={x.tag}>{x.tag}</a>
                        })}
                    </div>
                })()}
            </div>
        </div>;
    }
}


export default (p: Props) => {
    const props = {
        history: p.history,
        location: p.location,
        global: p.global
    }

    return <SearchTopics {...props} />;
}
