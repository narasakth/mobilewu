-- =============================================
-- AcneScan Database Schema for Supabase
-- Anonymous Auth + Sync with Local Storage
-- =============================================

-- 1. Analyses table (main data)
CREATE TABLE analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,  -- Anonymous identifier
    severity_level INT2 NOT NULL CHECK (severity_level BETWEEN 1 AND 5),
    severity_label TEXT,
    total_spots INT4 DEFAULT 0,
    inflamed_count INT4 DEFAULT 0,
    clogged_count INT4 DEFAULT 0,
    scars_count INT4 DEFAULT 0,
    local_id TEXT,  -- ID from local AsyncStorage for sync
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for device queries
CREATE INDEX idx_analyses_device_id ON analyses(device_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- 2. Detections table (AI markers)
CREATE TABLE detections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL CHECK (view_type IN ('frontal', 'left', 'right')),
    class_name TEXT NOT NULL,
    confidence FLOAT4,
    x FLOAT4,
    y FLOAT4,
    width FLOAT4,
    height FLOAT4
);

CREATE INDEX idx_detections_analysis_id ON detections(analysis_id);

-- 3. Device Stats table (cached statistics)
CREATE TABLE device_stats (
    device_id TEXT PRIMARY KEY,
    total_scans INT4 DEFAULT 0,
    avg_severity FLOAT4 DEFAULT 0,
    trend TEXT DEFAULT 'neutral' CHECK (trend IN ('improving', 'worsening', 'neutral')),
    last_scan_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- For anonymous access, we use device_id
-- =============================================

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_stats ENABLE ROW LEVEL SECURITY;

-- Policies for analyses (public read/write by device_id)
CREATE POLICY "Anyone can insert analyses" ON analyses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view analyses" ON analyses
    FOR SELECT USING (true);

-- Policies for detections (linked to analyses)
CREATE POLICY "Anyone can insert detections" ON detections
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view detections" ON detections
    FOR SELECT USING (true);

-- Policies for device_stats
CREATE POLICY "Anyone can manage device_stats" ON device_stats
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Functions for statistics
-- =============================================

-- Function to update device stats after new analysis
CREATE OR REPLACE FUNCTION update_device_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO device_stats (device_id, total_scans, avg_severity, last_scan_at, updated_at)
    SELECT 
        NEW.device_id,
        COUNT(*),
        AVG(severity_level),
        MAX(created_at),
        NOW()
    FROM analyses
    WHERE device_id = NEW.device_id
    ON CONFLICT (device_id) DO UPDATE SET
        total_scans = EXCLUDED.total_scans,
        avg_severity = EXCLUDED.avg_severity,
        last_scan_at = EXCLUDED.last_scan_at,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update stats
CREATE TRIGGER trigger_update_device_stats
    AFTER INSERT ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_device_stats();
