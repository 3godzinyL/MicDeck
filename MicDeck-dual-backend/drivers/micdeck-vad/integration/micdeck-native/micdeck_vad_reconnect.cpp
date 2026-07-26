#include "micdeck_vad_reconnect.h"
#include <Audioclient.h>
#include <chrono>
MicDeckVadReconnectController::MicDeckVadReconnectController(ReopenCallback r):reopen_(std::move(r)){}
MicDeckVadReconnectController::~MicDeckVadReconnectController(){Stop();}
void MicDeckVadReconnectController::Start(){if(running_.exchange(true))return;
 thread_=std::thread(&MicDeckVadReconnectController::Run,this);}
void MicDeckVadReconnectController::Stop(){if(!running_.exchange(false))return;
 requested_=true;if(thread_.joinable())thread_.join();}
void MicDeckVadReconnectController::NotifyRenderFailure(HRESULT e){
 if(e==AUDCLNT_E_DEVICE_INVALIDATED||e==AUDCLNT_E_SERVICE_NOT_RUNNING||
    e==HRESULT_FROM_WIN32(ERROR_DEVICE_NOT_AVAILABLE))requested_=true;}
uint64_t MicDeckVadReconnectController::ReconnectAttempts()const noexcept{return attempts_;}
uint64_t MicDeckVadReconnectController::ReconnectSuccesses()const noexcept{return successes_;}
void MicDeckVadReconnectController::Run(){
 unsigned backoff=250;while(running_){
  if(!requested_.exchange(false)){std::this_thread::sleep_for(std::chrono::milliseconds(100));continue;}
  while(running_){++attempts_;MicDeckVadEndpointPair p;
   if(SUCCEEDED(WaitForMicDeckVadEndpoints(1500,&p))){std::wstring error;
    if(reopen_(p.render_id,error)){++successes_;backoff=250;break;}}
   std::this_thread::sleep_for(std::chrono::milliseconds(backoff));
   backoff=backoff<4000?backoff*2:4000;}}}
