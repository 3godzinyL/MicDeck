#include "../shared/micdeck_cable_pipeline.h"
#include <cassert>
#include <iostream>
#include <vector>
namespace{
void fill(std::vector<float>&v,float x){for(float&s:v)s=x;}
void priming(){
 std::vector<float>storage(2048*2),in(480*2),out(240*2);fill(in,.5f);
 MdCablePipeline p;assert(p.Initialize(storage.data(),2048,MdLatencyMode::Balanced));
 p.SetProducerActive(true);p.SetConsumerActive(true);p.Write(in.data(),240);
 assert(p.Read(out.data(),240)==0);p.Write(in.data(),480);assert(p.Read(out.data(),240)==240);
}
void trim(){
 std::vector<float>storage(4096*2),in(2000*2),out(240*2);
 for(uint32_t i=0;i<2000;++i)in[i*2]=in[i*2+1]=static_cast<float>(i)/2000.f;
 MdCablePipeline p;assert(p.Initialize(storage.data(),4096,MdLatencyMode::UltraLow));
 p.SetProducerActive(true);p.SetConsumerActive(true);p.Write(in.data(),2000);p.Read(out.data(),240);
 auto s=p.Stats();assert(s.stale_trim_events>0);assert(s.ring.discarded_frames>0);assert(out[200]>.4f);
}
void fade(){
 std::vector<float>storage(2048*2),in(160*2),out(256*2);fill(in,.8f);
 MdCablePipeline p;assert(p.Initialize(storage.data(),2048,MdLatencyMode::UltraLow));
 p.SetProducerActive(true);p.SetConsumerActive(true);p.Write(in.data(),160);
 assert(p.Read(out.data(),256)==160);assert(out[(255)*2]==0);assert(p.Stats().fade_frames_generated>0);
}
void stop_clears(){
 std::vector<float>storage(2048*2),in(800*2),out(128*2);fill(in,.7f);
 MdCablePipeline p;assert(p.Initialize(storage.data(),2048,MdLatencyMode::Balanced));
 p.SetProducerActive(true);p.SetConsumerActive(true);p.Write(in.data(),800);
 p.SetProducerActive(false);p.Read(out.data(),128);for(float x:out)assert(x==0);
}}
int main(){priming();trim();fade();stop_clears();
 std::cout<<"MicDeck cable pipeline tests: PASS\n";}
