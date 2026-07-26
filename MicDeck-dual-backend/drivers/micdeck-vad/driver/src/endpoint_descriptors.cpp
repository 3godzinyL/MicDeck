#include "endpoint_descriptors.h"
#include "format.h"
#include "property_handlers.h"

namespace {

const KSDATARANGE_AUDIO g_AudioDataRange = {
    {
        sizeof(KSDATARANGE_AUDIO),
        0,
        0,
        0,
        STATICGUIDOF(KSDATAFORMAT_TYPE_AUDIO),
        STATICGUIDOF(KSDATAFORMAT_SUBTYPE_ANALOG),
        STATICGUIDOF(KSDATAFORMAT_SPECIFIER_NONE)
    },
    2,
    16,
    32,
    MD_INTERNAL_SAMPLE_RATE,
    MD_INTERNAL_SAMPLE_RATE
};

const PKSDATARANGE g_AudioDataRanges[] = {
    reinterpret_cast<const PKSDATARANGE>(&g_AudioDataRange)
};

const PCPIN_DESCRIPTOR g_RenderWavePins[] = {
    {
        1, 1, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_SINK,
            &KSCATEGORY_AUDIO,
            &KSNAME_Wave,
            0
        }
    },
    {
        0, 0, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNAME_Wave,
            0
        }
    }
};

const PCCONNECTION_DESCRIPTOR g_RenderWaveConnections[] = {
    {PCFILTER_NODE, MicDeckWavePinSystem,
     PCFILTER_NODE, MicDeckWavePinBridge}
};

const PCPIN_DESCRIPTOR g_CaptureWavePins[] = {
    {
        0, 0, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNAME_Wave,
            0
        }
    },
    {
        1, 1, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_SINK,
            &KSCATEGORY_AUDIO,
            &KSNAME_Wave,
            0
        }
    }
};

const PCCONNECTION_DESCRIPTOR g_CaptureWaveConnections[] = {
    {PCFILTER_NODE, MicDeckWavePinBridge,
     PCFILTER_NODE, MicDeckWavePinSystem}
};

const PCPIN_DESCRIPTOR g_RenderTopologyPins[] = {
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_LINE_CONNECTOR,
            0
        }
    },
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_SPEAKER,
            0
        }
    }
};

const PCCONNECTION_DESCRIPTOR g_RenderTopologyConnections[] = {
    {PCFILTER_NODE, MicDeckTopologyPinWave,
     PCFILTER_NODE, MicDeckTopologyPinEndpoint}
};

const PCPIN_DESCRIPTOR g_CaptureTopologyPins[] = {
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_MICROPHONE,
            0
        }
    },
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_AudioDataRanges),
            g_AudioDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_LINE_CONNECTOR,
            0
        }
    }
};

const PCCONNECTION_DESCRIPTOR g_CaptureTopologyConnections[] = {
    {PCFILTER_NODE, MicDeckTopologyPinEndpoint,
     PCFILTER_NODE, MicDeckTopologyPinWave}
};

} // namespace

PCFILTER_DESCRIPTOR g_MicDeckRenderWaveFilter = {
    0,
    &g_MicDeckVadAutomation,
    sizeof(PCPIN_DESCRIPTOR),
    ARRAYSIZE(g_RenderWavePins),
    g_RenderWavePins,
    sizeof(PCNODE_DESCRIPTOR),
    0,
    nullptr,
    ARRAYSIZE(g_RenderWaveConnections),
    g_RenderWaveConnections,
    0,
    nullptr
};

PCFILTER_DESCRIPTOR g_MicDeckCaptureWaveFilter = {
    0,
    &g_MicDeckVadAutomation,
    sizeof(PCPIN_DESCRIPTOR),
    ARRAYSIZE(g_CaptureWavePins),
    g_CaptureWavePins,
    sizeof(PCNODE_DESCRIPTOR),
    0,
    nullptr,
    ARRAYSIZE(g_CaptureWaveConnections),
    g_CaptureWaveConnections,
    0,
    nullptr
};

PCFILTER_DESCRIPTOR g_MicDeckRenderTopologyFilter = {
    0,
    nullptr,
    sizeof(PCPIN_DESCRIPTOR),
    ARRAYSIZE(g_RenderTopologyPins),
    g_RenderTopologyPins,
    sizeof(PCNODE_DESCRIPTOR),
    0,
    nullptr,
    ARRAYSIZE(g_RenderTopologyConnections),
    g_RenderTopologyConnections,
    0,
    nullptr
};

PCFILTER_DESCRIPTOR g_MicDeckCaptureTopologyFilter = {
    0,
    nullptr,
    sizeof(PCPIN_DESCRIPTOR),
    ARRAYSIZE(g_CaptureTopologyPins),
    g_CaptureTopologyPins,
    sizeof(PCNODE_DESCRIPTOR),
    0,
    nullptr,
    ARRAYSIZE(g_CaptureTopologyConnections),
    g_CaptureTopologyConnections,
    0,
    nullptr
};
