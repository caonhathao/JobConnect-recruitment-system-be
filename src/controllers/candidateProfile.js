
exports.getMyProfile = async (req, res) => {
    try{
        const user_id =req.user.id;
        const profile = await Profile.findOne({ where: { user_id } });  
        if(!profile){
            return res.status(404).json({ message: 'Profile not found' });
        }
        res.status(200).json({ profile });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: 'Internal server error' }); 

    }
}
