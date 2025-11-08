exports.postVideo = (req, res) => {
    const VideoInfo = req.app.locals.db.videos; // Access the NeDB datastore

    // Create a new video document
    const newVideo = {
        video_name: req.body.video_name,
        video_start: req.body.video_start,
        video_start_date_time: req.body.video_start_date_time,
        video_end: req.body.video_end,
        video_end_date_time: req.body.video_end_date_time,
        duration: req.body.duration
    };

    // Insert the new video document into the datastore
    VideoInfo.insert(newVideo, (err, savedVideo) => {
        if (err) {
            return res.status(500).json({ message: err.message });
        }
        res.status(201).json(savedVideo);
    });
};

exports.getVideo = (req, res) => {
    const VideoInfo = req.app.locals.db.videos; // Access the NeDB datastore

    // Find all video documents in the datastore
    VideoInfo.find({}, (err, videos) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving video data");
        }
        res.json(videos);
    });
};
