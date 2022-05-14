#version 310 es

#extension GL_GOOGLE_include_directive : enable

#include "constants.h"

layout(input_attachment_index = 0, set = 0, binding = 0) uniform highp subpassInput in_color;

layout(set = 0, binding = 1) uniform sampler2D color_grading_lut_texture_sampler;

layout(location = 0) out highp vec4 out_color;

highp vec4 getLutColor(highp float u, highp float v, highp float w)
{
    highp vec2 uv = vec2(w + u, v);
    return texture(color_grading_lut_texture_sampler, uv).rgba;
}

highp vec3 getFloorAndCeilVar(highp float v, highp float lutSize, highp float normalSize)
{
    highp float v1 = v * lutSize;
    highp float fv = floor(v1) * normalSize;
    highp float cv = ceil(v1) * normalSize;
    highp float a = v1 - fv;
    return vec3(fv, cv, a);
}

highp vec4 calcLayerLutColor(highp vec3 u, highp vec3 v, highp float w)
{
    highp vec4 f_color = getLutColor(u.x, v.x, w);
    highp vec4 h_color = getLutColor(u.y, v.x, w);

    highp vec4 color1 = mix(f_color, h_color, u.z);
    
    highp vec4 _f_color = getLutColor(u.x, v.y, w);
    highp vec4 _h_color = getLutColor(u.y, v.y, w);

    highp vec4 color2 = mix(_f_color, _h_color, u.z);

    highp vec4 color = mix(color1, color2, v.z);

    return color;
}

highp vec4 calcLutColor(highp vec4 color, highp ivec2 lut_tex_size){
    highp float r = color.r;
    highp float g = color.g;
    highp float b = color.b;

    highp float width = float(lut_tex_size.x);
    highp float height = float(lut_tex_size.y);

    highp vec3 vb = getFloorAndCeilVar(b, width, 1.0 / width);
    highp vec3 vr = getFloorAndCeilVar(r, height, 1.0 / (height * width));
    highp vec3 vg = getFloorAndCeilVar(g, height, 1.0 / height);

    highp vec4 color1 = calcLayerLutColor(vr, vg, vb.x);
    highp vec4 color2 = calcLayerLutColor(vr, vg, vb.y);

    color = mix(color1, color2, vb.z);

    return color;
}

void main()
{
    highp ivec2 lut_tex_size = textureSize(color_grading_lut_texture_sampler, 0);
    //highp float _COLORS      = float(lut_tex_size.y);

    highp vec4 color       = subpassLoad(in_color).rgba;
    
    //texture(color_grading_lut_texture_sampler, uv)
    color = calcLutColor(color, lut_tex_size);

    out_color = vec4(color.rgb, 1.0);
}
