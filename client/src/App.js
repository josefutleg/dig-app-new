import React, { Component } from "react";
import "./App.css";

// import SearchSongs from './components/Search';
import Header from "./components/Header";
// import {GetNowPlaying, NowPlaying} from './components/NowPlaying';
import SpotifyWebApi from "spotify-web-api-js";
import { ServerRequest } from "http";
import { domainToASCII } from "url";
const spotifyApi = new SpotifyWebApi();

class App extends Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    const params = this.getHashParams();
    const token = params.access_token;
    // let tracksArr = [];
    this.state = {
      loggedIn: token ? true : false,
      userId: "",
      token: token,
      songs: [], //replaced tracksArr
      artistId: "",
      songId: "",
      previewUrl: "",
      noUrl: "",
      playlistID: "",
      selectedURI: "",
      sortedArr: [],
      playlist_name: "",
      completed: false,
      readyFromBrowse: false
    };
    console.log(this.state);

    if (token) {
      spotifyApi.setAccessToken(token);
    }
  }

  componentDidMount() {
    fetch("https://api.spotify.com/v1/me", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        console.log(resultingJSON);
        this.setState({ userId: resultingJSON.id });
        if (this.state.userId !== undefined) {
          document.querySelector(".appLogoContainer").innerHTML = "";
          let navBar = document.querySelector("#navBar");
          navBar.classList.remove("hidden");
          let footer = document.querySelector("#footer");
          footer.classList.remove("hidden");
        }
      });
  }

  getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    e = r.exec(q);
    while (e) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
      e = r.exec(q);
    }
    return hashParams;
  }

  searchRelatedArtists = x => {
    let search = this.state.artistId;
    document.querySelector(".searchContainer").innerHTML = "";
    fetch(`https://api.spotify.com/v1/artists/${search}/related-artists/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        for (let i = 0; i < resultingJSON.artists.length; i++) {
          this.getRelatedArtistsAlbums(resultingJSON.artists[i].id);
        }
      });
  };

  getRelatedArtistsAlbums = x => {
    document.querySelector(".searchContainer").innerHTML = "";
    fetch(`https://api.spotify.com/v1/artists/${x}/albums`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        let albums = resultingJSON.items;
        let albumsL = albums.length;
        let randomAlbum1 = albums[this.getRandomInt(albumsL)].id;
        let randomAlbum2 = albums[this.getRandomInt(albumsL)].id;
        this.getRelatedArtistsSongs(randomAlbum1);
        this.getRelatedArtistsSongs(randomAlbum2);
      });
  };

  getRelatedArtistsSongs = x => {
    //FIND SONGS FROM THOSE PROJECTS

    fetch(`https://api.spotify.com/v1/albums/${x}/tracks`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        let tracks = resultingJSON.items;
        let tracksL = resultingJSON.items.length;
        let randomT = tracks[this.getRandomInt(tracksL)];
        let randomN = randomT.name;
        let randomArtist = randomT.artists[0].name;
        let randomURI = randomT.uri;
        let randomID = randomT.id;
        let randomPreviewUrl = randomT.preview_url;

        this.getRelatedAudioFeatures(
          randomID,
          randomN,
          randomArtist,
          randomURI,
          randomPreviewUrl
        );
      });
  };

  createPlaylist = x => {
    // let playlistName = `dig${this.getRandomInt(10000)}`;
    // this.setState({ playlist_name: playlistName });
    // console.log(`playlist name: ${playlistName}`);

    fetch(`https://api.spotify.com/v1/users/${this.state.userId}/playlists`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      },
      body: JSON.stringify({
        name: `${this.state.playlist_name}`,
        public: false,
        description: "Created with dig app"
      })
    })
      .then(res => res.json())
      .then(resultingJSON => {
        // console.log(resultingJSON.id);
        let pId = resultingJSON.id;
        this.setState({ playlistID: pId });
        if (this.state.readyFromBrowse === true) {
          this.fillPlaylist(this.state.songs);
        } else console.log("not ready yet");
      });
  };

  fillPlaylist = arr => {
    let id = this.state.playlistID;
    console.log(this.state.playlistID);
    console.log(arr.length);
    let str = this.state.songs.join(",");
    fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?uris=${str}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Content-Length": `${this.state.songs.length}`,
        Authorization: `Bearer ${this.state.token}`
      }
    }).then(res => {
      function setAttributes(el, attrs) {
        for (let key in attrs) {
          el.setAttribute(key, attrs[key]);
        }
      }
      console.log(res);
      this.setState({ previewUrl: "" });
      let loader = document.querySelector("#loader");
      loader.classList.add("hidden");
      let a = document.querySelector(".messageContainer");
      a.innerHTML = "";
      document.querySelector(".playlistContainer").innerHTML = "";
      let p = document.createElement("iframe");
      setAttributes(p, {
        src: `https://open.spotify.com/embed/user/${
          this.state.userId
        }/playlist/${this.state.playlistID}`,
        width: "300",
        height: "380",
        frameborder: "0",
        allowtransparency: "true",
        allow: "encrypted-media"
      });
      a.appendChild(p);
    });
    this.setState({ completed: true });
    this.saveToDB();
  };

  saveToDB = x => {
    // console.log(this.state.sortedArr);
    // console.log(this.state.playlist_name);
    if (this.state.readyFromBrowse === true) {
      console.log("playlist already exists in db");
      // this.initialState();
      this.setState({ songs: [] });
      this.setState({ sortedArr: [] });
    } else {
      let name = this.state.playlist_name;
      let tracks = this.state.sortedArr;
      return fetch("https://u-dig.herokuapp.com/playlists", {
        // return fetch("http://localhost:8000/playlists", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, tracks })
      });
    }
  };

  //function that will reset all properties in state.
  initialState = x => {
    console.log(this.state.completed);
    if (this.state.completed === true) {
      console.log("ready to reset");
      this.setState({ songs: [] });
      this.setState({ artistId: "" });
      this.setState({ songId: "" });
      this.setState({ previewUrl: "" });
      this.setState({ tempo: "" });
      this.setState({ selectedURI: "" });
      this.setState({ sortedArr: [] });
      this.setState({ playlist_name: "" });
      this.setState({ completed: false });
      this.setState({ readyFromBrowse: false });
      console.log("states cleared");
      console.log(this.state);
    }
  };

  browsePlaylists = event => {
    let b = document.querySelector(".browseContainer");
    b.innerHTML = "";
    document.querySelector(".playlistContainer").innerHTML = "";
    this.setState({ previewUrl: "" });
    document.querySelector(".searchContainer").innerHTML = "";
    document.querySelector(".messageContainer").innerHTML = "";
    fetch("https://u-dig.herokuapp.com/playlists", {    
    // fetch("http://localhost:8000/playlists", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        for (let i = 0; i < resultingJSON.length; i++) {
          let resContainer = document.createElement("div");
          let pName = document.createElement("p");
          let viewButton = document.createElement("button");
          let addButton = document.createElement("button");

          addButton.innerHTML = "add";
          addButton.setAttribute("id", "add");
          addButton.setAttribute("data-id", `${resultingJSON[i]._id}`);
          // addButton.onclick = this.viewPlaylist(resultingJSON[i]._id);

          viewButton.setAttribute("id", "view");
          viewButton.setAttribute("data-id", `${resultingJSON[i]._id}`);
          viewButton.innerText = "view";
          viewButton.onclick = this.viewPlaylist;

          pName.innerText = `${resultingJSON[i].name}`;
          pName.setAttribute("id", "title");

          resContainer.classList.add("resCont");
          resContainer.setAttribute("id", "mongoResCont");

          // resContainer.appendChild(addButton);
          resContainer.appendChild(viewButton);
          resContainer.appendChild(pName);

          for (let a = 0; a < resultingJSON[i].tracks.length; a++) {
            let pArtist = document.createElement("span");
            pArtist.innerText = `${resultingJSON[i].tracks[a].artist}, `;
            pArtist.setAttribute("id", "artist");
            resContainer.appendChild(pArtist);
          }

          b.appendChild(resContainer);
        }
        console.log(resultingJSON);
      });
  };

  viewPlaylist = event => {
    document.querySelector(".browseContainer").innerHTML = "";
    let id = event.target.getAttribute("data-id");
    console.log(id);
    fetch("https://u-dig.herokuapp.com/find", {
      // fetch("http://localhost:8000/find", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    })
      .then(res => res.json())
      .then(resultingJSON => {
        console.log(resultingJSON);

        let p = document.querySelector(".playlistContainer");
        let pHead = document.createElement("div");
        let addButton = document.createElement("button");
        let pHeader = document.createElement("h2");
        let pDiv = document.createElement("div");
        pDiv.classList.add("playlist");

        addButton.setAttribute("id", "add");
        addButton.innerText = "add";
        addButton.onclick = this.addPlaylist = x => {
          this.setState({ songs: "" });
          this.setState({ playlist_name: "" });
          let newArr = [];
          for (let i = 0; i < resultingJSON.tracks.length; i++) {
            newArr.push(resultingJSON.tracks[i].uri);
          }
          this.setState({ songs: newArr });
          this.setState({ playlist_name: resultingJSON.name });
          this.setState({ readyFromBrowse: true });
          console.log(this.state.playlist_name);
          console.log(this.state.songs);
          this.createPlaylist();
        };

        pHeader.innerText = `${resultingJSON.name}`;
        pHeader.setAttribute("style", "color: white;");

        pHead.classList.add("pHeader");
        pHead.appendChild(pHeader);
        pHead.appendChild(addButton);

        p.appendChild(pHead);

        for (let i = 0; i < resultingJSON.tracks.length; i++) {
          let resultDiv = document.createElement("div");
          let previewUrl = resultingJSON.tracks[i].preview_url;
          let artistName = resultingJSON.tracks[i].artist;
          let songName = resultingJSON.tracks[i].title;
          let playButton = document.createElement("button");

          let pT = document.createElement("p");
          pT.setAttribute("id", "title");
          pT.innerText = `${songName}`;

          let pA = document.createElement("p");
          pA.setAttribute("id", "artist");
          pA.innerText = `${artistName}`;

          playButton.setAttribute("id", "play");
          playButton.innerText = "play";

          resultDiv.classList.add("resCont");
          resultDiv.setAttribute("data-link", `${previewUrl}`);
          resultDiv.onclick = this.preview = x => {
            // console.log(previewUrl);
            this.setState({ previewUrl: "" });
            this.setState({ noUrl: "" });
            if (previewUrl == null) {
              this.setState({ noUrl: "oops! no preview available!" });
            } else {
              this.setState({ previewUrl: previewUrl });
            }
          };
          resultDiv.appendChild(playButton);
          resultDiv.appendChild(pT);
          resultDiv.appendChild(pA);
          pDiv.appendChild(resultDiv);
        }

        p.appendChild(pDiv);
      });
  };

  getRandomInt = x => {
    return Math.floor(Math.random() * Math.floor(x));
  };

  getAudioFeatures = x => {
    let search = this.state.songId;
    fetch(`https://api.spotify.com/v1/audio-features/${search}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        this.setState({ tempo: Math.floor(resultingJSON.tempo) });
        this.setState({ key: resultingJSON.key });
      });
  };

  getRelatedAudioFeatures = (id, song, artist, uri, prev) => {
    fetch(`https://api.spotify.com/v1/audio-features/${id}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.state.token}`
      }
    })
      .then(res => res.json())
      .then(resultingJSON => {
        let tempo = parseInt(Math.floor(resultingJSON.tempo));
        let key = parseInt(Math.floor(resultingJSON.key));
        let obj = {
          id: `${id}`,
          title: `${song}`,
          artist: `${artist}`,
          tempo: tempo,
          key: key,
          uri: `${uri}`,
          preview_url: `${prev}`
        };
        this.setState({ sortedArr: [...this.state.sortedArr, obj] });
        this.sortArray(this.state.sortedArr);
      });
  };

  sortArray = arr => {
    let sortedArr = arr.sort(function(a, b) {
      return a.key < b.key
        ? -1
        : a.key > b.key
        ? 1
        : a.tempo < b.tempo
        ? -1
        : 1;
    });
    this.setState({ sortedArr: sortedArr });
    let newArr = [];
    for (let i = 0; i < this.state.sortedArr.length; i++) {
      newArr.push(this.state.sortedArr[i].uri);
    }
    newArr.unshift(this.state.selectedURI);
    this.setState({ songs: newArr });
    // console.log(this.state.songs);
    if (this.state.songs.length >= 41) {
      this.fillPlaylist(this.state.songs);
    }
  };

  handleSubmit(event) {
    event.preventDefault();
    event.persist();
    let search = this.state.value;
    if (search == undefined) {
      return alert("please search a song");
    } else {
      this.setState({ songs: [] });
      this.setState({ sortedArr: [] });
      document.querySelector(".browseContainer").innerHTML = "";
      document.querySelector(".searchContainer").innerHTML = "";
      document.querySelector(".messageContainer").innerHTML = "";
      document.querySelector(".playlistContainer").innerHTML = "";

      let loader = document.querySelector("#loader");
      loader.classList.add("hidden");
      // console.log(search);
      fetch(`https://api.spotify.com/v1/search?q=${search}&type=track`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.state.token}`
        }
      })
        .then(res => res.json())
        .then(resultingJSON => {
          if (resultingJSON.tracks.items.length === 0) {
            console.log("nothing found");
            let a = document.querySelector(".searchContainer");
            let pM = document.createElement("p");
            pM.innerHTML = "oops! no tracks found!";
            a.appendChild(pM);
          } else {
            console.log(resultingJSON);
            for (let i = 0; i < resultingJSON.tracks.items.length; i++) {
              let previewUrl = resultingJSON.tracks.items[i].preview_url;
              let songId = resultingJSON.tracks.items[i].id;
              let artistName = resultingJSON.tracks.items[i].artists[0].name;
              let songName = resultingJSON.tracks.items[i].name;
              let artistId = resultingJSON.tracks.items[i].artists[0].id;
              let uri = resultingJSON.tracks.items[i].uri;
              let a = document.querySelector(".searchContainer");
              let resultDiv = document.createElement("div");
              let addButton = document.createElement("button");
              let playButton = document.createElement("button");

              let pT = document.createElement("p");
              pT.setAttribute("id", "title");
              pT.innerText = `${songName}`;

              let pA = document.createElement("p");
              pA.setAttribute("id", "artist");
              pA.innerText = `${artistName}`;

              addButton.setAttribute("id", "add");
              addButton.setAttribute("data-artist-id", `${artistId}`);
              addButton.setAttribute("data-song-id", `${songId}`);
              addButton.setAttribute("data-song-uri", `${uri}`);
              addButton.onclick = this.addArtist;
              addButton.innerText = "add";

              playButton.setAttribute("id", "play");
              playButton.innerText = "play";

              resultDiv.classList.add("resCont");
              resultDiv.setAttribute("data-link", `${previewUrl}`);
              resultDiv.onclick = this.preview = x => {
                // console.log(previewUrl);
                this.setState({ previewUrl: "" });
                this.setState({ noUrl: "" });
                if (previewUrl == null) {
                  this.setState({ noUrl: "oops! no preview available!" });
                } else {
                  this.setState({ previewUrl: previewUrl });
                }
              };
              resultDiv.appendChild(addButton);
              resultDiv.appendChild(playButton);
              resultDiv.appendChild(pT);
              resultDiv.appendChild(pA);
              a.appendChild(resultDiv);
            }
          }
        });
    }
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
    // console.log(event.target.value);
  }

  addArtist = event => {
    event.preventDefault();
    let loader = document.querySelector("#loader");
    loader.classList.remove("hidden");
    let a = document.querySelector(".messageContainer");
    a.innerHTML = "";
    let p = document.createElement("p");
    p.innerText = "please sit tight, while we put together your playlist!";
    p.setAttribute("style", "font-size : 14px");
    a.appendChild(p);
    let id = event.target.getAttribute("data-artist-id");
    let song = event.target.getAttribute("data-song-id");
    let uri = event.target.getAttribute("data-song-uri");
    let playlistName = `dig${this.getRandomInt(10000)}`;
    this.setState({ playlist_name: playlistName });
    console.log(`playlist name: ${playlistName}`);
    this.setState({ artistId: id });
    this.setState({ songId: song });
    this.setState({ selectedURI: uri });
    this.searchRelatedArtists();
    this.getAudioFeatures();
    this.createPlaylist();
  };

  render() {
    return (
      <div className="App">
        <div id="navBar" className="hidden">
          {/* <Header /> */}
          <div id="center" className="header">
            <div id="appBlock">
              <h2 id="appName">dig</h2>
              <div className="formContainer">
                {this.state.userId !== undefined && (
                  <p id="user">Hello, {this.state.userId}!</p>
                )}
                {this.state.token !== undefined && (
                  <button id="browse" onClick={this.browsePlaylists}>
                    browse
                  </button>
                )}

                {this.state.token !== undefined && (
                  <form onSubmit={this.handleSubmit} id="form">
                    <input
                      id="input"
                      type="text"
                      name="song"
                      placeholder="search a song"
                      value={this.state.value}
                      onChange={this.handleChange}
                    />
                    <button type="submit" value="Submit" id="submit">
                      {" "}
                      search{" "}
                    </button>
                  </form>
                )}
                {this.state.noUrl != "" && <p id="noUrl">{this.state.noUrl}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="messageContainer" id="center" />
        <div className="appLogoContainer" id="center">
          <div className="appLogoBox">
            <h1 id="appNameCover">dig</h1>
          </div>
          {/* <a href="http://localhost:8000/login"> */}
          <a href="https://u-dig.herokuapp.com/login">
            <button id="login">Sign Into Spotify</button>
          </a>
        </div>
        <div id="loader" className="hidden" />
        <div className="searchContainer" />
        <div className="browseContainer" />
        <div className="playlistContainer" />
        <div id="footer" className="hidden">
          <div className="previewContainer" id="center">
            {this.state.previewUrl != "" && (
              <embed src={this.state.previewUrl} id="player" />
            )}
            {/* <button onClick={(this.check = event => console.log(this.state))}>
              check
            </button> */}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
