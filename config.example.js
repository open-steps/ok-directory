window.plp = {
  config: {
    prototypesDir: "plp-prototypes/",
    prototypesTag: "v0.1.0",
    context: "http://plp.hackers4peace.net/context.jsonld",
    provider: {
      url: "http://profiles.open-steps.org:5000",
      persona: {
        backgroundColor: "#726B60",
        siteName: "PLP Provider",
        siteLogo: "https://pbs.twimg.com/profile_images/462046863890190336/9hITXfY1.png"
      }
    },
    directory: {
      url: "http://profiles.open-steps.org:5001"
    },
    geocoderCacherUrl: "http://directory.open-steps.org/geocoder-cacher/geocoder_cacher.php",
    twitterImageGetterUrl: "http://directory.open-steps.org/twitter-image-cacher/twitter_profile_retriever.php"
  }
};
