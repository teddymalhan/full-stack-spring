package com.richwavelet.backend.model;

public enum ProcessingStage {
    QUEUED,
    DOWNLOADING,
    ANALYZING,
    APPLYING_EFFECTS,
    INSERTING_ADS,
    ADDING_AUDIO_EFFECTS,
    ENCODING,
    UPLOADING,
    COMPLETED,
    FAILED
}
