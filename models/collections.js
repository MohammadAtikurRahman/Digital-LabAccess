const mongoose = require("mongoose");

const timeDataSchema = new mongoose.Schema({
    sessionStartTime: String,
    totalSeconds: Number,
    lastCheckedTime: String
});

const allTimeSchema = new mongoose.Schema({
    dayid: Number, 
    starttime: String,
    totaltime: Number,
    lasttime: String
});

const schoolSchema =  new mongoose.Schema({
    pcname: String,
    eiin: Number, 
    schoolname: String,
    labnum: Number,
    pcnum: Number,
 
});


const videoSchema = new mongoose.Schema({
    video_name: String,
    video_start: String,
    video_start_date_time: String,
    video_end: String,
    video_end_date_time: String,
    duration: Number
})

const geolocationSchema = new mongoose.Schema({
     
    latitude: String,
    longitude: String


})

module.exports = {
    TimeData: mongoose.model('TimeData', timeDataSchema),
    AllTime: mongoose.model('AllTime', allTimeSchema),
    SchoolInfo: mongoose.model('SchoolInfo', schoolSchema),
    VideoInfo: mongoose.model('VideoInfo',videoSchema),
    GeoLocationInfo: mongoose.model('GeoLocationInfo',geolocationSchema)

};
