// const { SchoolInfo } = require("../models/collections");
// const os = require('os');


// exports.postSchool = async (req, res) => {
//     try {
//         const pcname = os.hostname(); // Gets the PC's name
//         const { eiin, schoolname, labnum, pcnum } = req.body;

//         // Find the first document in the collection
//         let school = await SchoolInfo.findOne();

//         if (school) {
//             // Update the existing document
//             school.pcname = pcname;
//             school.eiin = eiin;
//             school.schoolname = schoolname;
//             school.labnum = labnum;
//             school.pcnum = pcnum;
           

//             await school.save();
//             res.status(200).send('School data updated successfully');
//         } else {
//             // Create a new document if none exists
//             school = new SchoolInfo({
//                 pcname,
//                 eiin,
//                 schoolname,
//                 labnum,
//                 pcnum,
          
//             });
//             await school.save();
//             res.status(201).send('New school data created successfully');
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Error processing school data');
//     }
// };


// exports.getSchool = async (req,res) =>  {
//     try {
//         const schools = await SchoolInfo.find();
//         res.json(schools);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send("Error retrieving school data");
//     }

const os = require('os');

exports.postSchool = (req, res) => {
    const SchoolInfo = req.app.locals.db.schools; // Access the NeDB datastore
    const pcname = os.hostname(); // Gets the PC's name
    const { eiin, schoolname, labnum, pcnum } = req.body;

    // NeDB doesn't have a findOne method, use find with a limit of 1
    SchoolInfo.findOne({}, (err, school) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error processing school data');
        }

        if (school) {
            // Update the existing document
            SchoolInfo.update({ _id: school._id }, { $set: { pcname, eiin, schoolname, labnum, pcnum } }, {}, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error updating school data');
                }
                res.status(200).send('School data updated successfully');
            });
        } else {
            // Create a new document if none exists
            SchoolInfo.insert({ pcname, eiin, schoolname, labnum, pcnum }, (err, newDoc) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error creating school data');
                }
                res.status(201).send('New school data created successfully');
            });
        }
    });
};

exports.getSchool = (req, res) => {
    const SchoolInfo = req.app.locals.db.schools; // Access the NeDB datastore

    SchoolInfo.find({}, (err, schools) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error retrieving school data");
        }
        res.json(schools);
    });
};
