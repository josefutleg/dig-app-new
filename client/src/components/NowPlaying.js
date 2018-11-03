import React from 'react';
import SpotifyWebApi from "spotify-web-api-js";
const spotifyApi = new SpotifyWebApi();

export const GetNowPlaying = (event) => {
    spotifyApi.getMyCurrentPlaybackState()
        .then((response) => {
        console.log(response.item.name);
        this.setState({
            nowPlaying: { 
                name: response.item.name, 
                albumArt: response.item.album.images[0].url
            }
        });
        })
}

export const NowPlaying = event => (
    <div>
        <button onClick={this.getNowPlaying()}>
            Check Now Playing
        </button>

    </div>
    
);


