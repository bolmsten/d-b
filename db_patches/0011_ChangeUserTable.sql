/*
author: 
    fredrikbolmsten
purpose: 
    link new columns to user table
date:
    26.nov.2019
*/

ALTER TABLE users DROP COLUMN organisation_address;
ALTER TABLE users DROP COLUMN nationality;
ALTER TABLE users DROP COLUMN organisation;

ALTER TABLE users ADD COLUMN organisation INTEGER REFERENCES institutions (institution_id);

ALTER TABLE users ADD COLUMN nationality INTEGER REFERENCES nationalities (nationality_id);