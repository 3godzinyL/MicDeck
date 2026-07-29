#include "endpoint_descriptors.h"
#include "format.h"
#include "property_handlers.h"

namespace {

// Host (streaming) pins must advertise real WAVEFORMATEX ranges, otherwise KS finds
// no intersection with the client's format and NewStream is never called. The
// ANALOG / SPECIFIER_NONE range below belongs on the bridge pins only.
KSDATARANGE_AUDIO g_PcmStreamRange = {
    {
        sizeof(KSDATARANGE_AUDIO),
        0,
        0,
        0,
        STATICGUIDOF(KSDATAFORMAT_TYPE_AUDIO),
        STATICGUIDOF(KSDATAFORMAT_SUBTYPE_PCM),
        STATICGUIDOF(KSDATAFORMAT_SPECIFIER_WAVEFORMATEX)
    },
    2,
    16,
    32,
    MD_INTERNAL_SAMPLE_RATE,
    MD_INTERNAL_SAMPLE_RATE
};

KSDATARANGE_AUDIO g_FloatStreamRange = {
    {
        sizeof(KSDATARANGE_AUDIO),
        0,
        0,
        0,
        STATICGUIDOF(KSDATAFORMAT_TYPE_AUDIO),
        STATICGUIDOF(KSDATAFORMAT_SUBTYPE_IEEE_FLOAT),
        STATICGUIDOF(KSDATAFORMAT_SPECIFIER_WAVEFORMATEX)
    },
    2,
    32,
    32,
    MD_INTERNAL_SAMPLE_RATE,
    MD_INTERNAL_SAMPLE_RATE
};

const PKSDATARANGE g_StreamDataRanges[] = {
    reinterpret_cast<PKSDATARANGE>(&g_PcmStreamRange),
    reinterpret_cast<PKSDATARANGE>(&g_FloatStreamRange)
};

KSDATARANGE g_BridgeRange = {
    sizeof(KSDATARANGE),
    0,
    0,
    0,
    STATICGUIDOF(KSDATAFORMAT_TYPE_AUDIO),
    STATICGUIDOF(KSDATAFORMAT_SUBTYPE_ANALOG),
    STATICGUIDOF(KSDATAFORMAT_SPECIFIER_NONE)
};

const PKSDATARANGE g_BridgeDataRanges[] = {
    &g_BridgeRange
};

// Index order matters: the pin id passed to PcRegisterPhysicalConnection is the array
// index, so these must line up with MICDECK_WAVE_PIN / MICDECK_TOPOLOGY_PIN.
const PCPIN_DESCRIPTOR g_RenderWavePins[] = {
    // [MicDeckWavePinSystem] the host writes rendered audio here
    {
        1, 1, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_StreamDataRanges),
            g_StreamDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_SINK,
            &KSCATEGORY_AUDIO,
            nullptr,
            0
        }
    },
    // [MicDeckWavePinBridge] wired to the topology filter
    {
        0, 0, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_BridgeDataRanges),
            g_BridgeDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            nullptr,
            0
        }
    }
};

const PCCONNECTION_DESCRIPTOR g_RenderWaveConnections[] = {
    {PCFILTER_NODE, MicDeckWavePinSystem,
     PCFILTER_NODE, MicDeckWavePinBridge}
};

const PCPIN_DESCRIPTOR g_CaptureWavePins[] = {
    // [MicDeckWavePinSystem] the host reads the virtual microphone here
    {
        1, 1, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_StreamDataRanges),
            g_StreamDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_SINK,
            &KSCATEGORY_AUDIO,
            nullptr,
            0
        }
    },
    // [MicDeckWavePinBridge] fed by the topology filter
    {
        0, 0, 0,
        nullptr,
        {
            0, nullptr,
            0, nullptr,
            SIZEOF_ARRAY(g_BridgeDataRanges),
            g_BridgeDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            nullptr,
            0
        }
    }
};

const PCCONNECTION_DESCRIPTOR g_CaptureWaveConnections[] = {
    {PCFILTER_NODE, MicDeckWavePinBridge,
     PCFILTER_NODE, MicDeckWavePinSystem}
};

const PCPIN_DESCRIPTOR g_RenderTopologyPins[] = {
    // [MicDeckTopologyPinWave]
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_BridgeDataRanges),
            g_BridgeDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_LINE_CONNECTOR,
            0
        }
    },
    // [MicDeckTopologyPinEndpoint] this is what Windows shows as the playback device
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_BridgeDataRanges),
            g_BridgeDataRanges,
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
    // [MicDeckTopologyPinWave]
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_BridgeDataRanges),
            g_BridgeDataRanges,
            KSPIN_DATAFLOW_OUT,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_LINE_CONNECTOR,
            0
        }
    },
    // [MicDeckTopologyPinEndpoint] this is what Windows shows as the microphone
    {
        0, 0, 0, nullptr,
        {
            0, nullptr, 0, nullptr,
            SIZEOF_ARRAY(g_BridgeDataRanges),
            g_BridgeDataRanges,
            KSPIN_DATAFLOW_IN,
            KSPIN_COMMUNICATION_NONE,
            &KSCATEGORY_AUDIO,
            &KSNODETYPE_MICROPHONE,
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
