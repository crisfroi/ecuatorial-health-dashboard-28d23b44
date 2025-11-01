using AutoMapper;
using Qiandao.Model.Entity;
using Qiandao.Model.Request;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Qiandao.Service
{
    class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Addaccess_day, Access_day>()
           .ForMember(dest => dest.Id, opt => opt.Ignore())
           .ForMember(dest => dest.Serial, opt => opt.MapFrom(src => src.Serial))
           .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
           .ForMember(dest => dest.start_time1, opt => opt.MapFrom(src => src.startTime1))
           .ForMember(dest => dest.end_time1, opt => opt.MapFrom(src => src.endTime1))
           .ForMember(dest => dest.start_time2, opt => opt.MapFrom(src => src.startTime2))
           .ForMember(dest => dest.end_time2, opt => opt.MapFrom(src => src.endTime2))
           .ForMember(dest => dest.start_time3, opt => opt.MapFrom(src => src.startTime3))
           .ForMember(dest => dest.end_time3, opt => opt.MapFrom(src => src.endTime3))
           .ForMember(dest => dest.start_time4, opt => opt.MapFrom(src => src.startTime4))
           .ForMember(dest => dest.end_time4, opt => opt.MapFrom(src => src.endTime4))
           .ForMember(dest => dest.start_time5, opt => opt.MapFrom(src => src.startTime5))
           .ForMember(dest => dest.end_time5, opt => opt.MapFrom(src => src.endTime5));
            CreateMap<Addaccess_week, Access_week>().ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .AfterMap((src, dest) =>
            {
                // 在更新时设置 ID
                if (dest.Id == 0 && src.Id != 0)
                {
                    dest.Id = src.Id;
                }
            }); ;
            
        }
    }
}
